export interface LanguageOption {
  id: string;
  name: string;
  monacoLanguage: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { id: 'python', name: 'Python', monacoLanguage: 'python' },
  { id: 'javascript', name: 'JavaScript', monacoLanguage: 'javascript' },
  { id: 'typescript', name: 'TypeScript', monacoLanguage: 'typescript' },
  { id: 'java', name: 'Java', monacoLanguage: 'java' },
  { id: 'cpp', name: 'C++', monacoLanguage: 'cpp' },
  { id: 'go', name: 'Go', monacoLanguage: 'go' },
];

export const STARTER_TEMPLATES: Record<string, Record<string, string>> = {
  'two-sum': {
    python: `def two_sum(nums, target):\n    # Write your solution here\n    pass\n`,
    javascript: `/**\n * @param {number[]} nums\n * @param {number} target\n * @return {number[]}\n */\nfunction twoSum(nums, target) {\n    // Write your solution here\n}\n`,
    typescript: `function twoSum(nums: number[], target: number): number[] {\n    // Write your solution here\n    return [];\n}\n`,
    java: `class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        // Write your solution here\n        return new int[]{};\n    }\n}\n`,
    cpp: `#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        // Write your solution here\n        return {};\n    }\n};\n`,
    go: `package main\n\nfunc twoSum(nums []int, target int) []int {\n    // Write your solution here\n    return nil\n}\n`,
  },
  'valid-parentheses': {
    python: `def is_valid(s):\n    # Write your solution here\n    pass\n`,
    javascript: `/**\n * @param {string} s\n * @return {boolean}\n */\nfunction isValid(s) {\n    // Write your solution here\n}\n`,
    typescript: `function isValid(s: string): boolean {\n    // Write your solution here\n    return false;\n}\n`,
    java: `class Solution {\n    public boolean isValid(String s) {\n        // Write your solution here\n        return false;\n    }\n}\n`,
    cpp: `#include <string>\nusing namespace std;\n\nclass Solution {\npublic:\n    bool isValid(string s) {\n        // Write your solution here\n        return false;\n    }\n};\n`,
    go: `package main\n\nfunc isValid(s string) bool {\n    // Write your solution here\n    return false\n}\n`,
  },
  'reverse-linked-list': {
    python: `class ListNode:\n    def __init__(self, val=0, next=None):\n        self.val = val\n        self.next = next\n\ndef reverse_list(head):\n    # Write your solution here\n    pass\n`,
    javascript: `class ListNode {\n    constructor(val = 0, next = null) {\n        this.val = val;\n        this.next = next;\n    }\n}\n\nfunction reverseList(head) {\n    // Write your solution here\n}\n`,
    typescript: `class ListNode {\n    val: number;\n    next: ListNode | null;\n    constructor(val = 0, next = null) {\n        this.val = val;\n        this.next = next;\n    }\n}\n\nfunction reverseList(head: ListNode | null): ListNode | null {\n    // Write your solution here\n    return null;\n}\n`,
    java: `public class ListNode {\n    int val;\n    ListNode next;\n    ListNode(int val) { this.val = val; }\n}\n\nclass Solution {\n    public ListNode reverseList(ListNode head) {\n        // Write your solution here\n        return null;\n    }\n}\n`,
    cpp: `struct ListNode {\n    int val;\n    ListNode *next;\n    ListNode(int x) : val(x), next(nullptr) {}\n};\n\nclass Solution {\npublic:\n    ListNode* reverseList(ListNode* head) {\n        // Write your solution here\n        return nullptr;\n    }\n};\n`,
    go: `package main\n\ntype ListNode struct {\n    Val int\n    Next *ListNode\n}\n\nfunc reverseList(head *ListNode) *ListNode {\n    // Write your solution here\n    return nil\n}\n`,
  },
  'longest-substring-no-repeat': {
    python: `def length_of_longest_substring(s):\n    # Write your solution here\n    pass\n`,
    javascript: `/**\n * @param {string} s\n * @return {number}\n */\nfunction lengthOfLongestSubstring(s) {\n    // Write your solution here\n}\n`,
    typescript: `function lengthOfLongestSubstring(s: string): number {\n    // Write your solution here\n    return 0;\n}\n`,
    java: `class Solution {\n    public int lengthOfLongestSubstring(String s) {\n        // Write your solution here\n        return 0;\n    }\n}\n`,
    cpp: `#include <string>\nusing namespace std;\n\nclass Solution {\npublic:\n    int lengthOfLongestSubstring(string s) {\n        // Write your solution here\n        return 0;\n    }\n};\n`,
    go: `package main\n\nfunc lengthOfLongestSubstring(s string) int {\n    // Write your solution here\n    return 0\n}\n`,
  },
  'number-of-islands': {
    python: `def num_islands(grid):\n    # Write your solution here\n    pass\n`,
    javascript: `/**\n * @param {character[][]} grid\n * @return {number}\n */\nfunction numIslands(grid) {\n    // Write your solution here\n}\n`,
    typescript: `function numIslands(grid: string[][]): number {\n    // Write your solution here\n    return 0;\n}\n`,
    java: `class Solution {\n    public int numIslands(char[][] grid) {\n        // Write your solution here\n        return 0;\n    }\n}\n`,
    cpp: `#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    int numIslands(vector<vector<char>>& grid) {\n        // Write your solution here\n        return 0;\n    }\n};\n`,
    go: `package main\n\nfunc numIslands(grid [][]byte) int {\n    // Write your solution here\n    return 0\n}\n`,
  },
  'course-schedule': {
    python: `def can_finish(num_courses, prerequisites):\n    # Write your solution here\n    pass\n`,
    javascript: `/**\n * @param {number} numCourses\n * @param {number[][]} prerequisites\n * @return {boolean}\n */\nfunction canFinish(numCourses, prerequisites) {\n    // Write your solution here\n}\n`,
    typescript: `function canFinish(numCourses: number, prerequisites: number[][]): boolean {\n    // Write your solution here\n    return false;\n}\n`,
    java: `class Solution {\n    public boolean canFinish(int numCourses, int[][] prerequisites) {\n        // Write your solution here\n        return false;\n    }\n}\n`,
    cpp: `#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    bool canFinish(int numCourses, vector<vector<int>>& prerequisites) {\n        // Write your solution here\n        return false;\n    }\n};\n`,
    go: `package main\n\nfunc canFinish(numCourses int, prerequisites [][]int) bool {\n    // Write your solution here\n    return false\n}\n`,
  },
  'word-break': {
    python: `def word_break(s, word_dict):\n    # Write your solution here\n    pass\n`,
    javascript: `/**\n * @param {string} s\n * @param {string[]} wordDict\n * @return {boolean}\n */\nfunction wordBreak(s, wordDict) {\n    // Write your solution here\n}\n`,
    typescript: `function wordBreak(s: string, wordDict: string[]): boolean {\n    // Write your solution here\n    return false;\n}\n`,
    java: `import java.util.List;\n\nclass Solution {\n    public boolean wordBreak(String s, List<String> wordDict) {\n        // Write your solution here\n        return false;\n    }\n}\n`,
    cpp: `#include <string>\n#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    bool wordBreak(string s, vector<string>& wordDict) {\n        // Write your solution here\n        return false;\n    }\n};\n`,
    go: `package main\n\nfunc wordBreak(s string, wordDict []string) bool {\n    // Write your solution here\n    return false\n}\n`,
  },
  'merge-k-sorted-lists': {
    python: `class ListNode:\n    def __init__(self, val=0, next=None):\n        self.val = val\n        self.next = next\n\ndef merge_k_lists(lists):\n    # Write your solution here\n    pass\n`,
    javascript: `function mergeKLists(lists) {\n    // Write your solution here\n}\n`,
    typescript: `function mergeKLists(lists: Array<ListNode | null>): ListNode | null {\n    // Write your solution here\n    return null;\n}\n`,
    java: `class Solution {\n    public ListNode mergeKLists(ListNode[] lists) {\n        // Write your solution here\n        return null;\n    }\n}\n`,
    cpp: `#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    ListNode* mergeKLists(vector<ListNode*>& lists) {\n        // Write your solution here\n        return nullptr;\n    }\n};\n`,
    go: `package main\n\nfunc mergeKLists(lists []*ListNode) *ListNode {\n    // Write your solution here\n    return nil\n}\n`,
  },
  'trapping-rain-water': {
    python: `def trap(height):\n    # Write your solution here\n    pass\n`,
    javascript: `/**\n * @param {number[]} height\n * @return {number}\n */\nfunction trap(height) {\n    // Write your solution here\n}\n`,
    typescript: `function trap(height: number[]): number {\n    // Write your solution here\n    return 0;\n}\n`,
    java: `class Solution {\n    public int trap(int[] height) {\n        // Write your solution here\n        return 0;\n    }\n}\n`,
    cpp: `#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    int trap(vector<int>& height) {\n        // Write your solution here\n        return 0;\n    }\n};\n`,
    go: `package main\n\nfunc trap(height []int) int {\n    // Write your solution here\n    return 0\n}\n`,
  },
};

export const GENERIC_TEMPLATES: Record<string, string> = {
  python: `# Write your solution in Python\ndef solution():\n    pass\n`,
  javascript: `// Write your solution in JavaScript\nfunction solution() {\n    \n}\n`,
  typescript: `// Write your solution in TypeScript\nfunction solution(): void {\n    \n}\n`,
  java: `// Write your solution in Java\nclass Solution {\n    public void solution() {\n        \n    }\n}\n`,
  cpp: `// Write your solution in C++\n#include <iostream>\nusing namespace std;\n\nclass Solution {\npublic:\n    void solution() {\n        \n    }\n};\n`,
  go: `// Write your solution in Go\npackage main\n\nfunc solution() {\n    \n}\n`,
};

export function getStarterCode(problemId?: string, language: string = 'python'): string {
  const langKey = language.toLowerCase();
  if (problemId && STARTER_TEMPLATES[problemId] && STARTER_TEMPLATES[problemId][langKey]) {
    return STARTER_TEMPLATES[problemId][langKey];
  }
  return GENERIC_TEMPLATES[langKey] || GENERIC_TEMPLATES.python;
}
