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
exports.play = void 0;
const node_process_1 = require("node:process");
const core = __importStar(require("@actions/core"));
const github = __importStar(require("@actions/github"));
const general_1 = require("./utils/general");
const lcov_1 = require("./utils/lcov");
const clover_1 = require("./utils/clover");
const gocoverage_1 = require("./utils/gocoverage");
const github_1 = require("./utils/github");
const SUPPORTED_FORMATS = ['lcov', 'clover', 'go'];
/** Starting Point of the Github Action*/
function play() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            if (github.context.eventName !== 'pull_request') {
                core.info('Pull request not detected. Exiting early.');
                return;
            }
            core.info('Performing Code Coverage Analysis');
            const GITHUB_TOKEN = core.getInput('GITHUB_TOKEN', { required: true });
            const COVERAGE_FILE_PATH = core.getInput('COVERAGE_FILE_PATH', {
                required: true
            });
            let COVERAGE_FORMAT = core.getInput('COVERAGE_FORMAT');
            if (!COVERAGE_FORMAT) {
                COVERAGE_FORMAT = 'lcov';
            }
            if (!SUPPORTED_FORMATS.includes(COVERAGE_FORMAT)) {
                throw new Error(`COVERAGE_FORMAT must be one of ${SUPPORTED_FORMATS.join(',')}`);
            }
            const debugOpts = {};
            const DEBUG = core.getInput('DEBUG');
            if (DEBUG) {
                const debugParts = DEBUG.split(',');
                for (const part of debugParts) {
                    debugOpts[part] = true;
                }
            }
            // TODO perhaps make base path configurable in case coverage artifacts are
            // not produced on the Github worker?
            const workspacePath = node_process_1.env.GITHUB_WORKSPACE || '';
            core.info(`Workspace: ${workspacePath}`);
            // 1. Parse coverage file
            if (COVERAGE_FORMAT === 'clover') {
                var parsedCov = yield (0, clover_1.parseClover)(COVERAGE_FILE_PATH, workspacePath);
            }
            else if (COVERAGE_FORMAT === 'go') {
                // Assuming that go.mod is available in working directory
                var parsedCov = yield (0, gocoverage_1.parseGoCoverage)(COVERAGE_FILE_PATH, 'go.mod');
            }
            else {
                // lcov default
                var parsedCov = yield (0, lcov_1.parseLCov)(COVERAGE_FILE_PATH, workspacePath);
            }
            // Sum up lines.found for each entry in parsedCov
            const totalLines = parsedCov.reduce((acc, entry) => acc + entry.lines.found, 0);
            const coveredLines = parsedCov.reduce((acc, entry) => acc + entry.lines.hit, 0);
            core.info(`Parsing done. ${parsedCov.length} files parsed. Total lines: ${totalLines}. Covered lines: ${coveredLines}.`);
            // 2. Filter Coverage By File Name
            const coverageByFile = (0, general_1.filterCoverageByFile)(parsedCov);
            core.info('Filter done');
            if (debugOpts['coverage']) {
                core.info(`Coverage:`);
                for (const item of coverageByFile) {
                    core.info(JSON.stringify(item));
                }
            }
            const githubUtil = new github_1.GithubUtil(GITHUB_TOKEN);
            // 3. Get current pull request files
            const pullRequestFiles = yield githubUtil.getPullRequestDiff();
            if (debugOpts['pr_lines_added']) {
                core.info(`PR lines added: ${JSON.stringify(pullRequestFiles)}`);
            }
            const annotations = githubUtil.buildAnnotations(coverageByFile, pullRequestFiles);
            // 4. Annotate in github
            yield githubUtil.annotate({
                referenceCommitHash: githubUtil.getPullRequestRef(),
                annotations
            });
            core.info('Annotation done');
        }
        catch (error) {
            if (error instanceof Error)
                core.setFailed(error.message);
            core.info(JSON.stringify(error));
        }
    });
}
exports.play = play;
