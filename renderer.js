// renderer.js

const fs = require('fs');
const { ipcRenderer } = require('electron');

const dnaFileInput = document.getElementById('dnaFile');
const dna1Textarea = document.getElementById('dna1');
const dna2Textarea = document.getElementById('dna2');
const matchInput = document.getElementById('match');
const mismatchInput = document.getElementById('mismatch');
const gapInput = document.getElementById('gap');
const alignBtn = document.getElementById('alignBtn');
const resultTextarea = document.getElementById('result');
const saveBtn = document.getElementById('saveBtn');
const scoreDisplay = document.getElementById('scoreDisplay');
const selectedFileName = document.getElementById('selectedFileName');

function updateAlignButtonState() {
    const seq1 = dna1Textarea.value.replace(/\s/g, '');
    const seq2 = dna2Textarea.value.replace(/\s/g, '');
    alignBtn.disabled = !seq1 || !seq2;
}

dna1Textarea.addEventListener('input', updateAlignButtonState);
dna2Textarea.addEventListener('input', updateAlignButtonState);
updateAlignButtonState();

// Đọc file FASTA trực tiếp trong renderer
if (dnaFileInput) {
    dnaFileInput.addEventListener('click', () => {
        dnaFileInput.value = '';
    });

    dnaFileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            if (selectedFileName) {
                selectedFileName.textContent = `Đã chọn: ${file.name}`;
            }

            const filePath = file.path;
            fs.readFile(filePath, 'utf8', (err, data) => {
                if (err) {
                    console.error('Error reading file:', err);
                    if (selectedFileName) {
                        selectedFileName.textContent = `Lỗi đọc file: ${file.name}`;
                    }
                    return;
                }

                const sequences = parseFASTA(data);
                console.log('Parsed sequences from file:', sequences);

                dna1Textarea.value = '';
                dna2Textarea.value = '';

                if (sequences.length >= 1) {
                    dna1Textarea.value = sequences[0].sequence;
                }
                if (sequences.length >= 2) {
                    dna2Textarea.value = sequences[1].sequence;
                }
                updateAlignButtonState();
            });
        }
    });
}

alignBtn.addEventListener('click', async () => {
    console.log('Align button clicked');

    const seq1 = dna1Textarea.value.replace(/\s/g, '');
    const seq2 = dna2Textarea.value.replace(/\s/g, '');
    const match = parseInt(matchInput.value);
    const mismatch = parseInt(mismatchInput.value);
    const gap = parseInt(gapInput.value);

    console.log('seq1:', seq1, 'seq2:', seq2, 'match:', match, 'mismatch:', mismatch, 'gap:', gap);

    if (!seq1 || !seq2) {
        return;
    }

    // Thêm hiệu ứng loading
    alignBtn.disabled = true;
    alignBtn.textContent = 'Đang xử lý...';

    console.log('Running alignment for:', seq1, seq2);
    const result = needlemanWunsch(seq1, seq2, match, mismatch, gap);
    console.log('Alignment result:', result);

    resultTextarea.value = result.alignment;
    scoreDisplay.textContent = `Total Score: ${result.score}`;

    // Enable nút save
    saveBtn.disabled = false;

    // Reset nút align theo trạng thái dữ liệu hiện tại
    updateAlignButtonState();
    alignBtn.textContent = 'Thực hiện Align';
});

// Lưu file kết quả
saveBtn.addEventListener('click', async () => {
    const result = resultTextarea.value;
    if (!result) {
        alert('Không có kết quả để lưu.');
        return;
    }

    const fastaContent = `>Aligned_Sequence_1\n${result.split('\n')[0]}\n>Aligned_Sequence_2\n${result.split('\n')[1]}\n`;

    saveBtn.disabled = true;
    saveBtn.textContent = 'Đang lưu...';

    try {
        const response = await ipcRenderer.invoke('save-fasta-file', fastaContent);
        if (response.success) {
            alert(`File đã được lưu thành công tại: ${response.filePath}`);
            saveBtn.disabled = true;
        } else {
            alert('Lỗi khi lưu file: ' + response.error);
            saveBtn.disabled = false;
        }
    } catch (err) {
        console.error('Error:', err);
        alert('Lỗi khi lưu file.');
        saveBtn.disabled = false;
    }
    saveBtn.textContent = 'Lưu file FASTA';
});

function needlemanWunsch(seq1, seq2, matchScore, mismatchScore, gapPenalty) {
    const m = seq1.length;
    const n = seq2.length;
    const matrix = Array(m + 1).fill().map(() => Array(n + 1).fill(0));

    // Initialize first row and column
    for (let i = 1; i <= m; i++) {
        matrix[i][0] = matrix[i - 1][0] + gapPenalty;
    }
    for (let j = 1; j <= n; j++) {
        matrix[0][j] = matrix[0][j - 1] + gapPenalty;
    }

    // Fill the matrix
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            const match = seq1[i - 1] === seq2[j - 1] ? matchScore : mismatchScore;
            matrix[i][j] = Math.max(
                matrix[i - 1][j - 1] + match,
                matrix[i - 1][j] + gapPenalty,
                matrix[i][j - 1] + gapPenalty
            );
        }
    }

    // Traceback
    let alignedSeq1 = '';
    let alignedSeq2 = '';
    let i = m;
    let j = n;

    while (i > 0 || j > 0) {
        if (i > 0 && j > 0 && matrix[i][j] === matrix[i - 1][j - 1] + (seq1[i - 1] === seq2[j - 1] ? matchScore : mismatchScore)) {
            alignedSeq1 = seq1[i - 1] + alignedSeq1;
            alignedSeq2 = seq2[j - 1] + alignedSeq2;
            i--;
            j--;
        } else if (i > 0 && matrix[i][j] === matrix[i - 1][j] + gapPenalty) {
            alignedSeq1 = seq1[i - 1] + alignedSeq1;
            alignedSeq2 = '-' + alignedSeq2;
            i--;
        } else {
            alignedSeq1 = '-' + alignedSeq1;
            alignedSeq2 = seq2[j - 1] + alignedSeq2;
            j--;
        }
    }

    return {
        score: matrix[m][n],
        alignment: alignedSeq1 + '\n' + alignedSeq2
    };
}

// Chuyển định dạng sang file Fasta
function parseFASTA(data) {
    const lines = data.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    const sequences = [];
    let currentSequence = null;

    for (const line of lines) {
        if (line.startsWith('>')) {
            if (currentSequence) {
                sequences.push(currentSequence);
            }
            currentSequence = { header: line, sequence: '' };
        } else {
            if (currentSequence) {
                currentSequence.sequence += line;
            }
        }
    }
    if (currentSequence) {
        sequences.push(currentSequence);
    }

    if (sequences.length === 0) {
        // Nếu file không phải FASTA, giả định mỗi dòng là một chuỗi DNA riêng biệt
        const plainLines = data.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        return plainLines.slice(0, 2).map((sequence, index) => ({ header: `>Sequence_${index + 1}`, sequence }));
    }

    return sequences.slice(0, 2);
}
