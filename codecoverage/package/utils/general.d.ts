export declare function filterCoverageByFile(coverage: CoverageParsed): CoverageFile[];
export declare function coalesceLineNumbers(lines: number[]): LineRange[];
export declare function intersectLineRanges(a: LineRange[], b: LineRange[]): LineRange[];
export type CoverageParsed = {
    file: string;
    title: string;
    lines: {
        found: number;
        hit: number;
        details: {
            line: number;
            hit: number;
            name: string;
        }[];
    };
}[];
export type CoverageFile = {
    fileName: string;
    missingLineNumbers: number[];
};
export type LineRange = {
    start_line: number;
    end_line: number;
};
