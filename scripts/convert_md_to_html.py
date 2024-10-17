import os
import markdown



header = """
<!DOCTYPE html>
<html>
<head>
    <title>Hi!</title>
    <link rel="stylesheet" href="../style.css">
</head>
<body>
"""

footer = """
</body>
</html>
"""



input_folder = 'markdown'
output_folder = 'html'
os.makedirs(input_folder, exist_ok=True)
os.makedirs(output_folder, exist_ok=True)

for root, dirs, files in os.walk(input_folder):
    for filename in files:
        if filename.endswith('.md'):
            filepath = os.path.join(root, filename)
            with open(filepath, 'r') as f:
                text = f.read().replace(".md)", ".html)")
                html = markdown.markdown(text)
                html = header + html + footer

            relative_path = os.path.relpath(filepath, input_folder)
            output_path = os.path.join(output_folder, relative_path.replace('.md', '.html'))
            os.makedirs(os.path.dirname(output_path), exist_ok=True)
            with open(output_path, 'w') as f:
                f.write(html)
