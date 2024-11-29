import { PortableText } from "next-sanity";
import imageUrlBuilder from "@sanity/image-url";
import { client } from "@/sanity/client";
import Link from "next/link";
import Image from "next/image";
import { SanityImageSource } from "@sanity/image-url/lib/types/types";

// Interface for type safety
interface Post {
  title: string;
  publishedAt: string;
  image?: {
    asset: {
      _ref: string;
    };
  };
  body: any[];
}

// GROQ query to fetch the post by slug
const POST_QUERY = `*[_type == "post" && slug.current == $slug][0]`;

// Generate image URLs
const { projectId, dataset } = client.config();
const urlFor = (source: SanityImageSource) =>
  projectId && dataset
    ? imageUrlBuilder({ projectId, dataset }).image(source)
    : null;

export default async function PostPage({
  params,
}: {
  params: { slug: string };
}) {
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
          alt={post.title}
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
