import { Metadata } from "next";
import { PortableText } from "next-sanity";
import imageUrlBuilder from "@sanity/image-url";
import { client } from "@/sanity/client";
import Link from "next/link";
import Image from "next/image";

// Detailed type definitions
interface SanityImage {
  _type: "image";
  asset: {
    _ref: string;
    _type: "reference";
  };
  alt?: string;
}

interface PortableTextBlock {
  _type: string;
  _key?: string;
  children?: {
    _type: string;
    text: string;
    marks?: string[];
  }[];
  style?: string;
  listItem?: string;
}

interface Post {
  title: string;
  publishedAt: string;
  image?: SanityImage;
  body: PortableTextBlock[];
  slug: {
    current: string;
  };
}

// GROQ query to fetch the post by slug
const POST_QUERY = `*[_type == "post" && slug.current == $slug][0]{
  title,
  publishedAt,
  "slug": slug.current,
  image,
  body
}`;

// Generate image URLs with more specific typing
const { projectId, dataset } = client.config();
const urlFor = (source: SanityImage) =>
  projectId && dataset
    ? imageUrlBuilder({ projectId, dataset }).image(source)
    : null;

type PageProps = {
  params: {
    slug: string;
  };
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const post: Post | null = await client.fetch(POST_QUERY, {
    slug: params.slug,
  });

  return {
    title: post?.title || "Blog Post",
    description: post?.body ? post.body[0]?.children?.[0]?.text : "",
  };
}

export default async function PostPage({ params }: PageProps) {
  // Fetch the post using the slug from the dynamic route
  const post: Post | null = await client.fetch(POST_QUERY, {
    slug: params.slug,
  });

  if (!post) {
    return (
      <main className="container mx-auto min-h-screen max-w-3xl p-8 flex flex-col gap-4">
        <p className="text-red-500">Post not found</p>
        <Link href="/" className="hover:underline">
          ← Back to posts
        </Link>
      </main>
    );
  }

  // Generate the image URL if the post has an image
  const postImageUrl = post.image
    ? urlFor(post.image)?.width(800).height(400).url()
    : null;

  return (
    <main className="container mx-auto min-h-screen max-w-3xl p-8 flex flex-col gap-4">
      <Link href="/" className="hover:underline">
        ← Back to posts
      </Link>

      {postImageUrl && (
        <Image
          src={postImageUrl}
          alt={post.image?.alt || post.title}
          className="rounded-xl object-cover"
          width={800}
          height={400}
          priority
        />
      )}

      <h1 className="text-4xl font-bold mb-8">{post.title}</h1>

      <div className="prose">
        <p>Published: {new Date(post.publishedAt).toLocaleDateString()}</p>

        {post.body && <PortableText value={post.body} />}
      </div>
    </main>
  );
}
