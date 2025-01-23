interface FileDiff {
    filename: string;
    addedLines: number[];
    deletedLines: number[];
}
export declare function parseGitDiff(diffOutput: string): FileDiff[];
export {};
