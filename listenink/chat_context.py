import os

folder_path = "src/components/"

include = []
exclude = ['Sidebar', 'poo', 'AudioControls', 'DS_Store']


for root, _, files in os.walk(folder_path):
    for file_name in files:
        # any(i in file_name for i in include)
        blank = not include and not exclude
        inc = any(i in file_name for i in include)
        exc = not any(i in file_name for i in exclude)
        if blank or inc or exc:
            file_path = os.path.join(root, file_name)
            print(f"File: {file_path}\n```")
            try:
                with open(file_path, 'r', encoding='utf-8') as file:
                    content = file.read()
                    print(f"Content:\n{content}\n")
            except Exception as e:
                # print(f"Could not read file {file_path} due to: {e}\n")
                pass
            print("```")
