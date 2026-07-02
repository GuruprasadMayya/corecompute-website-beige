#!/usr/bin/env python3
"""
Link and portability validator for this static site.

Checks, across every *.html file in this directory:
  1. HTML tag balance (no unclosed/mismatched tags).
  2. Every local file reference (href/src to .html/.css/.js/images) resolves
     to a file that actually exists on disk.
  3. Every same-page or cross-page #fragment link resolves to a real
     id="..." in the target document.
  4. No internal link uses an absolute path (leading "/"), a protocol-relative
     URL ("//..."), or a hardcoded domain — internal links must be relative
     so the whole site can be dropped into any subdirectory, domain, or
     hosting provider without edits.
  5. External links (http/https to a different host, mailto:, tel:) are
     left alone but reported for visibility.

Run from the site root:
    python3 test-links.py

Exits 0 and prints "ALL CHECKS PASSED" if clean; exits 1 and prints every
failure otherwise. No third-party dependencies — stdlib only.
"""

import os
import re
import sys
from html.parser import HTMLParser
from urllib.parse import urlparse

SITE_ROOT = os.path.dirname(os.path.abspath(__file__))
HTML_FILES = sorted(f for f in os.listdir(SITE_ROOT) if f.endswith(".html"))

VOID_TAGS = {
    "area", "base", "br", "col", "embed", "hr", "img", "input", "link",
    "meta", "param", "source", "track", "wbr",
}

# Attributes that can carry a local resource reference, per tag.
LINKABLE_ATTRS = {
    "a": "href",
    "img": "src",
    "script": "src",
    "link": "href",
    "source": "src",
    "iframe": "src",
}


class PageScanner(HTMLParser):
    def __init__(self):
        super().__init__()
        self.stack = []
        self.tag_errors = []
        self.ids = set()
        self.links = []  # list of (tag, attr_value)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if "id" in attrs:
            self.ids.add(attrs["id"])
        attr_name = LINKABLE_ATTRS.get(tag)
        if attr_name and attrs.get(attr_name):
            self.links.append((tag, attrs[attr_name]))
        if tag not in VOID_TAGS:
            self.stack.append(tag)

    def handle_startendtag(self, tag, attrs):
        # self-closing in source (rare in HTML5, but handle svg/path etc.)
        attrs = dict(attrs)
        if "id" in attrs:
            self.ids.add(attrs["id"])

    def handle_endtag(self, tag):
        if tag in VOID_TAGS:
            return
        if not self.stack:
            self.tag_errors.append(f"Unexpected closing tag </{tag}> with empty stack")
            return
        if self.stack[-1] == tag:
            self.stack.pop()
        elif tag in self.stack:
            self.tag_errors.append(f"Mismatched close </{tag}>, expected </{self.stack[-1]}>")
            while self.stack and self.stack[-1] != tag:
                self.stack.pop()
            if self.stack:
                self.stack.pop()
        else:
            self.tag_errors.append(f"Closing tag </{tag}> has no matching open tag")


def scan_file(path):
    with open(path, encoding="utf-8") as f:
        content = f.read()
    scanner = PageScanner()
    scanner.feed(content)
    return scanner


def main():
    errors = []
    warnings = []
    external_links = []

    pages = {}
    for fname in HTML_FILES:
        pages[fname] = scan_file(os.path.join(SITE_ROOT, fname))

    for fname, scanner in pages.items():
        # 1. Tag balance
        if scanner.stack:
            errors.append(f"{fname}: unclosed tag(s) at EOF: {scanner.stack}")
        for e in scanner.tag_errors:
            errors.append(f"{fname}: {e}")

        # 2-4. Link resolution + relativity
        for tag, raw in scanner.links:
            value = raw.strip()

            if value.startswith(("mailto:", "tel:", "javascript:", "data:")):
                continue

            parsed = urlparse(value)

            if parsed.scheme in ("http", "https"):
                external_links.append(f"{fname}: <{tag}> -> {value}")
                continue

            if value.startswith("//"):
                errors.append(
                    f"{fname}: <{tag}> href/src '{value}' is protocol-relative — "
                    f"not portable, use a relative path or full https:// external URL"
                )
                continue

            if value.startswith("/"):
                errors.append(
                    f"{fname}: <{tag}> href/src '{value}' is an absolute path — "
                    f"breaks when the site is hosted under a subdirectory. Use a relative path."
                )
                continue

            # Local reference: split off any #fragment
            path_part, _, fragment = value.partition("#")

            if path_part == "":
                # pure same-page anchor, e.g. href="#contact-form"
                if fragment and fragment not in scanner.ids:
                    errors.append(f"{fname}: anchor '#{fragment}' has no matching id=\"{fragment}\" on this page")
                continue

            resolved = os.path.normpath(os.path.join(SITE_ROOT, path_part))
            if not resolved.startswith(SITE_ROOT):
                errors.append(f"{fname}: <{tag}> reference '{value}' resolves outside the site root")
                continue
            if not os.path.exists(resolved):
                errors.append(f"{fname}: <{tag}> reference '{value}' -> file not found ({path_part})")
                continue

            if fragment:
                target_fname = os.path.basename(resolved)
                if target_fname in pages:
                    if fragment not in pages[target_fname].ids:
                        errors.append(
                            f"{fname}: link to '{value}' -- id \"{fragment}\" not found in {target_fname}"
                        )
                else:
                    warnings.append(f"{fname}: link '{value}' has a #fragment but target isn't an HTML page, skipping id check")

    # 5. CSS url(...) references — resolved relative to the CSS file's own directory
    css_files = []
    for root, _dirs, files in os.walk(os.path.join(SITE_ROOT, "assets", "css")):
        for f in files:
            if f.endswith(".css"):
                css_files.append(os.path.join(root, f))

    url_re = re.compile(r'url\(\s*["\']?([^"\')]+)["\']?\s*\)')
    for css_path in css_files:
        css_dir = os.path.dirname(css_path)
        rel_name = os.path.relpath(css_path, SITE_ROOT)
        with open(css_path, encoding="utf-8") as f:
            css_content = f.read()
        for match in url_re.finditer(css_content):
            ref = match.group(1).strip()
            if ref.startswith(("data:", "http://", "https://", "//")):
                continue
            if ref.startswith("/"):
                errors.append(f"{rel_name}: url({ref}) is an absolute path — not portable, use a path relative to the CSS file")
                continue
            resolved = os.path.normpath(os.path.join(css_dir, ref))
            if not resolved.startswith(SITE_ROOT):
                errors.append(f"{rel_name}: url({ref}) resolves outside the site root")
            elif not os.path.exists(resolved):
                errors.append(f"{rel_name}: url({ref}) -> file not found")

    print(f"Scanned {len(HTML_FILES)} HTML files: {', '.join(HTML_FILES)}")
    print(f"Scanned {len(css_files)} CSS file(s) for url() references\n")

    if external_links:
        print(f"External links found ({len(external_links)}, informational only):")
        for e in external_links:
            print(f"  - {e}")
        print()

    if warnings:
        print(f"Warnings ({len(warnings)}):")
        for w in warnings:
            print(f"  - {w}")
        print()

    if errors:
        print(f"FAILURES ({len(errors)}):")
        for e in errors:
            print(f"  ✗ {e}")
        print(f"\n{len(errors)} check(s) failed.")
        sys.exit(1)

    print("ALL CHECKS PASSED — every internal link resolves, all internal links are relative, no broken anchors, no unclosed tags.")
    sys.exit(0)


if __name__ == "__main__":
    main()
