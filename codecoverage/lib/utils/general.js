"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.intersectLineRanges = exports.coalesceLineNumbers = exports.filterCoverageByFile = void 0;
function filterCoverageByFile(coverage) {
    return coverage.map(item => {
        var _a;
        return ({
            fileName: item.file,
            missingLineNumbers: (_a = item === null || item === void 0 ? void 0 : item.lines) === null || _a === void 0 ? void 0 : _a.details.filter(line => line.hit === 0).map(line => line.line)
        });
    });
}
exports.filterCoverageByFile = filterCoverageByFile;
function coalesceLineNumbers(lines) {
    const ranges = [];
    let rstart;
    let rend;
    for (let i = 0; i < lines.length; i++) {
        rstart = lines[i];
        rend = rstart;
        while (lines[i + 1] - lines[i] === 1) {
            rend = lines[i + 1];
            i++;
        }
        ranges.push({ start_line: rstart, end_line: rend });
    }
    return ranges;
}
exports.coalesceLineNumbers = coalesceLineNumbers;
function intersectLineRanges(a, b) {
    const result = [];
    let i = 0;
    let j = 0;
    while (i < a.length && j < b.length) {
        const rangeA = a[i];
        const rangeB = b[j];
        if (rangeA.end_line < rangeB.start_line) {
            i++;
        }
        else if (rangeB.end_line < rangeA.start_line) {
            j++;
        }
        else {
            const start = Math.max(rangeA.start_line, rangeB.start_line);
            const end = Math.min(rangeA.end_line, rangeB.end_line);
            result.push({ start_line: start, end_line: end });
            if (rangeA.end_line < rangeB.end_line) {
                i++;
            }
            else {
                j++;
            }
        }
    }
    return result;
}
exports.intersectLineRanges = intersectLineRanges;
