"""optimize_images.py - shrinks big pictures in assets/images so the website loads fast on a phone.

Runs automatically on GitHub (see .github/workflows/optimize-images.yml) whenever you upload pictures.
What it does:
  * hero picture  -> at most 1600 px wide
  * project pictures (proj-*) -> at most 960 px wide
  * tile pictures (k-*) -> at most 720 px wide
  * saves real JPEG files, quality 80, usually 80 to 300 KB each
  * logos and the favicon are never touched
  * pictures that are already small are left alone, so running it twice changes nothing
"""
import os, sys
from PIL import Image, ImageOps

FOLDER = "assets/images"
SKIP = ("logo", "favicon")
LIMITS = [("hero", 1600), ("proj-", 960), ("k-", 720)]
DEFAULT_MAX = 960
SMALL_ENOUGH = 350 * 1024   # bytes: below this and already a JPEG of the right size, leave it alone

def max_width(name):
    for prefix, w in LIMITS:
        if name.startswith(prefix):
            return w
    return DEFAULT_MAX

def main():
    if not os.path.isdir(FOLDER):
        print("No", FOLDER, "folder - nothing to do"); return 0
    changed = 0
    for name in sorted(os.listdir(FOLDER)):
        base, ext = os.path.splitext(name)
        if ext.lower() not in (".jpg", ".jpeg", ".png", ".webp") or base.startswith(SKIP):
            continue
        path = os.path.join(FOLDER, name)
        before = os.path.getsize(path)
        try:
            im = Image.open(path)
            real_format = im.format
            im = ImageOps.exif_transpose(im)
            limit = max_width(base)
            already_ok = real_format == "JPEG" and im.width <= limit and before <= SMALL_ENOUGH and ext.lower() == ".jpg"
            if already_ok:
                print("skip (already small):", name); continue
            if im.mode in ("RGBA", "LA", "P"):
                bg = Image.new("RGB", im.size, (3, 10, 24))          # dark navy behind any transparency
                im = im.convert("RGBA"); bg.paste(im, mask=im.split()[-1]); im = bg
            else:
                im = im.convert("RGB")
            if im.width > limit:
                im = im.resize((limit, round(im.height * limit / im.width)), Image.LANCZOS)
            out = os.path.join(FOLDER, base + ".jpg")
            im.save(out, "JPEG", quality=80, optimize=True, progressive=True)
            if out != path:
                os.remove(path)                                     # e.g. photo.png -> photo.jpg
            after = os.path.getsize(out)
            changed += 1
            print(f"{name}: {before/1024:.0f} KB -> {after/1024:.0f} KB ({im.width}x{im.height})")
        except Exception as e:                                        # one bad file must not stop the rest
            print("could not process", name, "-", e)
    print("done,", changed, "file(s) changed")
    return 0

if __name__ == "__main__":
    sys.exit(main())
