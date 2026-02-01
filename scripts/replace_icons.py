import os
import shutil

def replace_icons(app_path, logo_path):
    print(f"Replacing icons for {app_path}...")
    
    # Android Icons
    android_res_path = os.path.join(app_path, "android/app/src/main/res")
    if os.path.exists(android_res_path):
        for folder in os.listdir(android_res_path):
            if folder.startswith("mipmap-"):
                dest = os.path.join(android_res_path, folder, "ic_launcher.png")
                shutil.copy(logo_path, dest)
                print(f"  Updated Android: {dest}")
                # Also handle round icons if they exist
                round_dest = os.path.join(android_res_path, folder, "ic_launcher_round.png")
                if os.path.exists(round_dest):
                    shutil.copy(logo_path, round_dest)
                    print(f"  Updated Android Round: {round_dest}")

    # iOS Icons (Partial - replacing the biggest ones usually shown)
    ios_icon_path = os.path.join(app_path, "ios/Runner/Assets.xcassets/AppIcon.appiconset")
    if os.path.exists(ios_icon_path):
        for file in os.listdir(ios_icon_path):
            if file.endswith(".png"):
                dest = os.path.join(ios_icon_path, file)
                shutil.copy(logo_path, dest)
                print(f"  Updated iOS: {dest}")

# Apps and Logo
base_dir = "/Users/pavankodange/lunch-break-buddy"
logo = os.path.join(base_dir, "apps/employee_app/assets/logo.png")

replace_icons(os.path.join(base_dir, "apps/employee_app"), logo)
replace_icons(os.path.join(base_dir, "apps/vendor_app"), logo)
