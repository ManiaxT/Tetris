from playwright.sync_api import sync_playwright
import time
import os

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    page.on("console", lambda msg: print(f"Browser console: {msg.text}"))
    page.goto("http://localhost:8000")
    print("Page loaded.")
    time.sleep(1)
    
    # Click settings
    page.click("#btn-settings")
    time.sleep(1)
    
    # Create test wav
    test_wav = os.path.abspath("test_song_1_bass.wav")
    
    # Upload file
    page.set_input_files("#file-add-song", test_wav)
    print("File uploaded.")
    time.sleep(2)
    
    # Now we should see it in the playlist
    items = page.locator("#playlist-container li").all()
    print(f"Playlist items after add: {len(items)}")
    
    # Remove it
    if items:
        # The remove button is the second span
        page.locator("#playlist-container li").first.locator("span").nth(1).click()
        print("Clicked remove.")
        time.sleep(1)
    
    items_after_remove = page.locator("#playlist-container li").all()
    print(f"Playlist items after remove: {len(items_after_remove)}")
    
    # Reload page
    page.reload()
    time.sleep(2)
    
    page.click("#btn-settings")
    time.sleep(1)
    
    items_after_reload = page.locator("#playlist-container li").all()
    print(f"Playlist items after reload: {len(items_after_reload)}")
    
    browser.close()
