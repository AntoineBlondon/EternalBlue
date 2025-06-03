import os
import shutil
import markdown



def header(title, css_path, home_path):

    return f"""
<!DOCTYPE html>
<html>
<head>
    <title>{title}</title>
    <link rel="stylesheet" href="{css_path}">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body>
    <header>
        <div class="navbar">
            <a href="{home_path}/">home</a>
            <a href="{home_path}/projects">projects</a>
            <a href="{home_path}/about">about</a>
        </div>
    </header>
"""

footer = """
</body>
</html>
"""



input_folder = 'markdown'
output_folder = 'html'
css_folder =  'markdown/css'
os.makedirs(input_folder, exist_ok=True)
os.makedirs(output_folder, exist_ok=True)


for root, dirs, files in os.walk(input_folder):
    for filename in files:
        if filename.endswith('.md') and not filename.endswith("index.md"):
            filepath = os.path.join(root, filename)
            css_path = os.path.relpath(os.path.join(css_folder, 'style.css'), root)
            home_path = os.path.relpath(os.path.join(output_folder, '.'), root)
            with open(filepath, 'r') as f:
                text = f.read().replace(".md)", "/)")
                title = text.split('\n')[0].replace('# ', '')
                html = markdown.markdown(text, extensions=['attr_list'])
                html = header(title, css_path, home_path) + html + footer

            relative_path = os.path.relpath(filepath, input_folder)
            base_name = os.path.splitext(relative_path)[0]  # no extension
            output_dir = os.path.join(output_folder, base_name)
            os.makedirs(output_dir, exist_ok=True)
            output_path = os.path.join(output_dir, 'index.html')

            with open(output_path, 'w') as f:
                f.write(html)

        elif filename.endswith("index.md"):
            filepath = os.path.join(root, filename)
            css_path = os.path.relpath(os.path.join(css_folder, 'style.css'), root)
            with open(filepath, 'r') as f:
                text = f.read().replace(".md)", ".html)")
                title = text.split('\n')[0].replace('# ', '')
                html = markdown.markdown(text, extensions=['attr_list'])
                html = header(title, css_path) + html + footer

            relative_path = os.path.relpath(filepath, input_folder)
            output_path = os.path.join(output_folder, relative_path.replace('.md', '.html'))
            os.makedirs(os.path.dirname(output_path), exist_ok=True)
            with open(output_path, 'w') as f:
                f.write(html)

        else:
            filepath = os.path.join(root, filename)
            relative_path = os.path.relpath(filepath, input_folder)
            output_path = os.path.join(output_folder, relative_path)
            os.makedirs(os.path.dirname(output_path), exist_ok=True)
            shutil.copyfile(filepath, output_path)