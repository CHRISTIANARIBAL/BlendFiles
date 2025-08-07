import tkinter as tk
from tkinter import ttk
import random

# Simulate large total items
TOTAL_ITEMS = 5_000_000_000
current_item = 0

# Sample terminal-style messages
messages = [
    "Processing record {}.................................................",
    "Encrypting file {}.............................................................",
    "Hashing object {}...........................................................",
    "Uploading chunk {}.......................................................",
    "Compressing segment {}.........................................................",
    "Analyzing packet {}....................................................",
    "Syncing module {}.....................................................................",
    "Compiling kernel {}...........................................................",
    "Verifying block {}...............................................",
    "Storing value {}........................................................."
]

# Set up GUI
root = tk.Tk()
root.title("Processing Billions of Data")
root.geometry("600x500")
root.resizable(False, False)

# Header
tk.Label(root, text="Simulating Big Data Processing...", font=("Arial", 14, "bold")).pack(pady=5)

# Progress bar
progress = ttk.Progressbar(root, orient="horizontal", length=500, mode="determinate")
progress.pack(pady=10)

# Output area (fake terminal)
output = tk.Text(root, height=20, width=70, bg="black", fg="lime", font=("Courier", 10))
output.pack(pady=10)
output.config(state=tk.DISABLED)

# Counter label
counter_label = tk.Label(root, text="Processed: 0 / 5,000,000,000", font=("Arial", 10))
counter_label.pack()

def process_data():
    global current_item

    if current_item >= TOTAL_ITEMS:
        output_message("✅ Processing complete!")
        return

    # Number of items to process per cycle (reduce to slow down)
    items_per_cycle = 3

    for _ in range(items_per_cycle):
        current_item += 1
        msg_template = random.choice(messages)
        message = msg_template.format(current_item)

        output.config(state=tk.NORMAL)
        output.insert(tk.END, message + "\n")

        # Prevent memory overflow by trimming old lines
        if int(float(output.index('end-1c').split('.')[0])) > 100:
            output.delete('1.0', '2.0')

        output.config(state=tk.DISABLED)
        output.see(tk.END)

    # Update progress and label
    counter_label.config(text=f"Processed: {current_item:,} / {TOTAL_ITEMS:,}")
    progress['value'] = (current_item / TOTAL_ITEMS) * 100

    # Slow it down: 200 milliseconds between each update
    root.after(200, process_data)

def output_message(message):
    """Add a final message to the terminal when done."""
    output.config(state=tk.NORMAL)
    output.insert(tk.END, "\n" + message + "\n")
    output.config(state=tk.DISABLED)
    output.see(tk.END)

# Start simulation
process_data()
root.mainloop()
