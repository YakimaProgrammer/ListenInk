import os
from transformers import AutoTokenizer

pwd = os.getcwd()

folder_path = pwd

include = ["frontend"]
exclude = [".git", "node_modules", "hocr", "package-lock"] 
# exclude += ["topic", "course"]

# Initialize tokenizer before the loop
tokenizer = AutoTokenizer.from_pretrained("bert-base-uncased")
total_tokens = 0
file_count = 0


def tokenize_in_chunks(tokenizer, content, max_length=512):
    # Tokenize the entire content
    tokens = tokenizer.encode(content, add_special_tokens=False)

    # Split tokens into chunks
    chunks = []
    for i in range(0, len(tokens), max_length):
        chunk = tokens[i:i+max_length]
        chunks.append(chunk)

    return chunks


for root, _, files in os.walk(folder_path):
    for file_name in files:
        # any(i in file_name for i in include)
        file_path = os.path.join(root, file_name)

        # Check if file matches include criteria
        matches_include = len(include) == 0 or any(
            i in file_path for i in include)  # switch all out for any
        # all -> conjunction of conditions
        # any -> disjunction / union operation of conditions

        # Check if file matches exclude criteria
        matches_exclude = any(e in file_path for e in exclude)

        # Only print files that match include criteria and don't match exclude criteria
        if matches_include and not matches_exclude:
            print(f"File: {file_path}\nContent:```")
            try:
                with open(file_path, 'r', encoding='utf-8') as file:
                    content = file.read()
                    print(f"{content}\n")
                encoding = tokenizer(content, return_tensors="pt")
                file_token_count = len(encoding['input_ids'][0])
                total_tokens += file_token_count
                file_count += 1

            except Exception as e:
                print(f"Could not read file {file_path} due to: {e}\n")
                pass
            print("```")
        else:
            # print(f"File: {file_path}: Not shown.")
            pass

print(f"\n=== Summary ===")
print(f"Total files processed: {file_count}")
print(f"Total tokens across all files: {total_tokens}")
print(
    f"Average tokens per file: {total_tokens / file_count if file_count > 0 else 0:.2f}")