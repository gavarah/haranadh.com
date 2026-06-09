import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blogsCollection = defineCollection({
  loader: glob({ pattern: '**/[^_]*.md', base: "./src/content/blogs" }),
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
  loader: glob({ pattern: '**/[^_]*.md', base: "./src/content/solidstate" }),
  schema: z.object({
    title: z.string(),
    postNumber: z.number(),
    date: z.string(),
    readTime: z.string(),
    tag: z.string(),
  }),
});

const managementCollection = defineCollection({
  loader: glob({ pattern: '**/[^_]*.md', base: "./src/content/management" }),
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

export const collections = {
  'blogs': blogsCollection,
  'solidstate': solidstateCollection,
  'management': managementCollection,
};
