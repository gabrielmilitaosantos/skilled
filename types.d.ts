interface SkillRecord {
    id: string;
    authorId: string;
    title: string;
    description: string;
    tags: string[];
    installCommand: string;
    promptConfig: string;
    usageExample: string | null;
    createdAt: string;
    // Authors come by joins
    authorUsername: string;
    authorImageUrl: string | null;
    voteCount: number;
    // Actual user state - false for guests
    isVoted: boolean;
    isSaved: boolean;
}