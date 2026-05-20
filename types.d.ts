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
    authorEmail: string;
    authorUsername: string;
    authorImageUrl: string | null;
}