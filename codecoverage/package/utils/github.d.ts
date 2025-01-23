import { CoverageFile, LineRange } from './general';
export declare class GithubUtil {
    private client;
    constructor(token: string);
    getPullRequestRef(): string;
    getPullRequestDiff(): Promise<PullRequestFiles>;
    /**
     * https://docs.github.com/en/rest/checks/runs?apiVersion=2022-11-28#create-a-check-run
     * https://docs.github.com/en/rest/checks/runs?apiVersion=2022-11-28#update-a-check-run
     */
    annotate(input: InputAnnotateParams): Promise<number>;
    buildAnnotations(coverageFiles: CoverageFile[], pullRequestFiles: PullRequestFiles): Annotations[];
}
type InputAnnotateParams = {
    referenceCommitHash: string;
    annotations: Annotations[];
};
type Annotations = {
    path: string;
    start_line: number;
    end_line: number;
    start_column?: number;
    end_column?: number;
    annotation_level: string;
    message: string;
};
type PullRequestFiles = {
    [key: string]: LineRange[];
};
export {};
