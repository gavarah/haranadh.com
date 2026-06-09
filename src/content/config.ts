import { defineCollection, z } from 'astro:content';

const blogsCollection = defineCollection({
  type: 'content',
  schema: z.object({
    id: z.string().optional(),
    title: z.string(),
    excerpt: z.string(),
    date: z.string(),
    readTime: z.string(),
    tags: z.array(z.string()),
    featured: z.boolean().optional().default(false),
  }),
});

const solidstateCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    postNumber: z.number(),
    date: z.string(),
    readTime: z.string(),
    tag: z.string(),
  }),
});

export const collections = {
  'blogs': blogsCollection,
  'solidstate': solidstateCollection,
};
