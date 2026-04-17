# My DNA Alignment

A simple, desktop-based Electron application that performs global DNA sequence alignment using the **Needleman-Wunsch algorithm**.

## Video demo

## Features

*   **File Input:** Load DNA sequences directly from `.fasta`, `.fa`, `.pasta`, or `.txt` files.
*   **Manual Input:** Type or paste DNA sequences manually into text areas.
*   **Customizable Scoring System:** Set your own values for **Match**, **Mismatch**, and **Gap penalty** to observe how they affect the alignment.
*   **Visual Results:** View the aligned sequences side-by-side with the total alignment score.
*   **Save Output:** Export your alignment results directly to a new FASTA file (`result.fasta`).

## Tech Stack

*   [Electron](https://www.electronjs.org/)
*   HTML & Vanilla JavaScript
*   [Tailwind CSS](https://tailwindcss.com/) (via CDN)

## Prerequisites

Make sure you have [Node.js](https://nodejs.org/) installed on your machine.

## Installation & Running

1. Clone or download this repository.
2. Open a terminal in the project directory.
3. Install the required dependencies:
   ```bash
   npm install
   ```
4. Start the application:
   ```bash
   npm start
   ```

## How to use

1. Open the application.
2. Either click **"Chọn file DNA"** to load a FASTA file or manually paste sequences into **"Chuỗi DNA 1"** and **"Chuỗi DNA 2"**.
3. Adjust the **Match** (khớp), **Mismatch** (không khớp), and **Gap** (khoảng trống) scores if desired. (Default values are typically Match: `1`, Mismatch: `-1`, Gap: `-1`).
4. Click **"Thực hiện Align"** to calculate the alignment.
5. The result and total score will be displayed in the text box below.
6. Click **"Lưu file FASTA"** to export the result to your computer.
