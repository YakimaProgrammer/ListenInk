import os

pwd = os.getcwd()

folder_path = pwd

include = []
exclude = [".git", "node_modules", "hocr", "package-lock"]


for root, _, files in os.walk(folder_path):
    for file_name in files:
        # any(i in file_name for i in include)
        file_path = os.path.join(root, file_name)
        blank = not include and not exclude  # false
        inc = any(i in file_path for i in include)
        exc = not any(i in file_path for i in exclude)
        if blank or inc or exc:
            print(f"File: {file_path}\n```")
            try:
                with open(file_path, 'r', encoding='utf-8') as file:
                    content = file.read()
                    print(f"Content:\n{content}\n")
            except Exception as e:
                print(f"Could not read file {file_path} due to: {e}\n")
                pass
            print("```")
        else:
            # print(f"File: {file_path}: Not shown.")
            pass
