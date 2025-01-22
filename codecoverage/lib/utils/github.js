"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GithubUtil = void 0;
const core = __importStar(require("@actions/core"));
const diff = __importStar(require("./diff"));
const github = __importStar(require("@actions/github"));
const general_1 = require("./general");
const octokit_1 = require("octokit");
class GithubUtil {
    constructor(token) {
        if (!token) {
            throw new Error('GITHUB_TOKEN is missing');
        }
        this.client = new octokit_1.Octokit({ auth: token });
    }
    getPullRequestRef() {
        const pullRequest = github.context.payload.pull_request;
        return pullRequest
            ? pullRequest.head.ref
            : github.context.ref.replace('refs/heads/', '');
    }
    getPullRequestDiff() {
        return __awaiter(this, void 0, void 0, function* () {
            const pull_number = github.context.issue.number;
            const response = yield this.client.rest.pulls.get(Object.assign(Object.assign({}, github.context.repo), { pull_number, mediaType: {
                    format: 'diff'
                } }));
            // @ts-expect-error With mediaType param, response.data is actually a string, but the response type doesn't reflect this
            const fileLines = diff.parseGitDiff(response.data);
            const prFiles = {};
            for (const item of fileLines) {
                prFiles[item.filename] = (0, general_1.coalesceLineNumbers)(item.addedLines);
            }
            return prFiles;
        });
    }
    /**
     * https://docs.github.com/en/rest/checks/runs?apiVersion=2022-11-28#create-a-check-run
     * https://docs.github.com/en/rest/checks/runs?apiVersion=2022-11-28#update-a-check-run
     */
    annotate(input) {
        return __awaiter(this, void 0, void 0, function* () {
            if (input.annotations.length === 0) {
                return 0;
            }
            // github API lets you post 50 annotations at a time
            const chunkSize = 50;
            const chunks = [];
            for (let i = 0; i < input.annotations.length; i += chunkSize) {
                chunks.push(input.annotations.slice(i, i + chunkSize));
            }
            let lastResponseStatus = 0;
            let checkId;
            for (let i = 0; i < chunks.length; i++) {
                let status = 'in_progress';
                let conclusion = '';
                if (i === chunks.length - 1) {
                    status = 'completed';
                    conclusion = 'success';
                }
                const params = Object.assign(Object.assign(Object.assign(Object.assign({}, github.context.repo), { name: 'Annotate', head_sha: input.referenceCommitHash, status }), (conclusion && { conclusion })), { output: {
                        title: 'Coverage Tool',
                        summary: 'Missing Coverage',
                        annotations: chunks[i]
                    } });
                let response;
                if (i === 0) {
                    response = yield this.client.rest.checks.create(Object.assign({}, params));
                    checkId = response.data.id;
                }
                else {
                    response = yield this.client.rest.checks.update(Object.assign(Object.assign({}, params), { check_run_id: checkId }));
                }
                core.info(response.data.output.annotations_url);
                lastResponseStatus = response.status;
            }
            return lastResponseStatus;
        });
    }
    buildAnnotations(coverageFiles, pullRequestFiles) {
        const annotations = [];
        for (const current of coverageFiles) {
            // Only annotate relevant files
            const prFileRanges = pullRequestFiles[current.fileName];
            if (prFileRanges) {
                const coverageRanges = (0, general_1.coalesceLineNumbers)(current.missingLineNumbers);
                const uncoveredRanges = (0, general_1.intersectLineRanges)(coverageRanges, prFileRanges);
                // Only annotate relevant line ranges
                for (const uRange of uncoveredRanges) {
                    const message = uRange.end_line > uRange.start_line
                        ? 'These lines are not covered by a test'
                        : 'This line is not covered by a test';
                    annotations.push({
                        path: current.fileName,
                        start_line: uRange.start_line,
                        end_line: uRange.end_line,
                        annotation_level: 'warning',
                        message
                    });
                }
            }
        }
        core.info(`Annotation count: ${annotations.length}`);
        return annotations;
    }
}
exports.GithubUtil = GithubUtil;
