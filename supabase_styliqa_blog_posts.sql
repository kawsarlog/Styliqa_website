-- ═══════════════════════════════════════════════════════════════════
-- Styliqa blog — table, policies, and 2 seed posts.
-- Run once in the Supabase SQL Editor (same project as KawsarLog /
-- fashiontofactoryv1). Dedicated table name so it never collides with
-- kawsarlog_blog_posts or any other blog_posts table.
-- Hero images can live on the site (/assets/img/og/...) or Cloudflare R2.
-- ═══════════════════════════════════════════════════════════════════

create table if not exists styliqa_blog_posts (
  id                bigint generated always as identity primary key,
  slug              text unique not null,
  title             text not null,
  excerpt           text,
  content           text,
  category          text,
  category_slug     text,
  author            text default 'Styliqa Studio',
  hero_img          text,
  hero_img_alt      text,
  read_time         text,
  status            text not null default 'draft',
  meta_title        text,
  meta_description  text,
  og_title          text,
  og_description    text,
  og_image          text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  published_at      timestamptz
);

create index if not exists styliqa_blog_posts_status_idx
  on styliqa_blog_posts (status, published_at desc);

grant select on public.styliqa_blog_posts to anon, authenticated;
grant all on public.styliqa_blog_posts to service_role;

alter table styliqa_blog_posts enable row level security;

drop policy if exists "Public read published Styliqa posts" on styliqa_blog_posts;
create policy "Public read published Styliqa posts"
  on styliqa_blog_posts for select
  using (status = 'published');

-- ── Seed posts ─────────────────────────────────────────────────────
insert into styliqa_blog_posts (
  slug, title, excerpt, content, category, category_slug, author,
  hero_img, hero_img_alt, read_time, status,
  meta_title, meta_description, og_title, og_description, og_image,
  published_at
) values (
  'tech-pack-vs-flat-sketch',
  'Tech Pack vs. Flat Sketch: What Your Factory Actually Needs',
  'The difference between a pretty drawing and a document a factory can produce from without back-and-forth.',
  '<p>Almost every mis-produced sample we''ve been called in to fix starts the same way: a brand sent a factory a flat sketch and expected tech-pack results. The two documents look similar at a glance. They are not interchangeable, and the gap between them is where sampling delays, wrong trims, and size confusion come from.</p>
<h2>What a flat sketch actually is</h2>
<p>A flat sketch (or "technical flat") is a clean, proportionate line drawing of a garment, shown front and back, without a body inside it. No shading, no styling, just the construction lines: seams, darts, topstitching, closures, pockets. It answers one question: <strong>what does this garment look like, flat?</strong></p>
<p>A good flat sketch is genuinely useful. It''s what a designer uses to communicate a concept, what goes into a lookbook or line sheet, and what a factory uses as a starting reference before anything else exists. On its own, though, it doesn''t tell anyone how to build the garment; it tells them what the garment should look like once it''s built.</p>
<h2>What a tech pack actually is</h2>
<p>A tech pack is the full production instruction set. It includes the flat sketch, but wraps it in everything a factory needs to cut, sew, grade, and finish the garment without guessing:</p>
<ul>
<li><strong>Point-of-measure (POM) sheet:</strong> exact measurements at every key point, per size.</li>
<li><strong>Bill of materials (BOM):</strong> every fabric, trim, thread, and hardware, with supplier or reference codes where possible.</li>
<li><strong>Construction and stitch details:</strong> seam types, stitch counts per inch, finishing methods.</li>
<li><strong>Labels, care instructions, and packaging notes.</strong></li>
<li><strong>Graded specs</strong> across the full size range, so a size Small and a size XL both fit the way they''re supposed to.</li>
</ul>
<p>It answers a different question: <strong>exactly how is this garment built, at every size, with zero ambiguity?</strong></p>
<h2>Where brands actually get burned</h2>
<p>A flat sketch is fine for early concept work, pitching a buyer, or getting a rough sourcing quote. It is not fine as the only document you hand a factory before a bulk order. Without a POM sheet, a factory has to guess your fit intent. Without a BOM, they''ll substitute trims. Without graded specs, your Medium might fit true and your Large might not, because nobody defined how the grade rules should scale between them.</p>
<p>The pattern is consistent: the earlier a brand skips the tech pack step to "save time," the more expensive the fix becomes once samples come back wrong, and the more rounds of revision it takes to get a bulk order approved.</p>
<div class="article__callout"><strong>Quick self-check</strong>If you''re about to place a sample or bulk order and the only document you have is a flat sketch or a moodboard, stop and get a tech pack built first. It''s a fraction of the cost of a failed production run.</div>
<h2>Which one do you actually need right now?</h2>
<p>If you''re still deciding on silhouette, pitching a concept, or sourcing early quotes: a flat sketch, or a small package with a couple of colorways, is usually enough. If you''re moving into sampling, grading across sizes, or placing any kind of production order: you need a full tech pack, not a nicer flat sketch.</p>
<p>Most projects that start with "I just need a sketch" end up needing the tech pack within a few weeks anyway, once a factory actually asks for measurements or a BOM. Building it once, properly, is almost always faster than patching a flat sketch into production-readiness under deadline pressure.</p>',
  'Tech Packs', 'tech-packs', 'Styliqa Studio',
  'https://styliqa.studio/assets/img/blog/cover-tech-pack-vs-flat-sketch.jpg',
  'Tech pack flat sketch with fabric swatches on cream paper',
  '4 min read', 'published',
  'Tech Pack vs. Flat Sketch: What Factories Need | Styliqa',
  'A flat sketch shows what a garment looks like. A tech pack tells a factory how to build it correctly, every time.',
  'Tech Pack vs. Flat Sketch: What Your Factory Actually Needs',
  'A flat sketch shows what a garment looks like. A tech pack tells a factory how to build it correctly, every time. Here''s the real difference, and how to know which one you need.',
  'https://styliqa.studio/assets/img/og/og-blog-tech-pack-vs-flat-sketch.jpg',
  '2026-07-15T10:00:00Z'
)
on conflict (slug) do nothing;

insert into styliqa_blog_posts (
  slug, title, excerpt, content, category, category_slug, author,
  hero_img, hero_img_alt, read_time, status,
  meta_title, meta_description, og_title, og_description, og_image,
  published_at
) values (
  'pattern-grading-101',
  'Pattern Grading 101: How One Size Becomes a Full Size Range',
  'Why grading is proportion, not just scaling, and where most self-taught size ranges quietly break.',
  '<p>A recurring support request looks like this: "our Medium fits great, but our Large and our Small both feel off." Almost every time, the cause is the same. The base pattern was fine. The grading was not.</p>
<h2>Grading is not scaling</h2>
<p>It''s tempting to think of a size range as one pattern, scaled up and down like a photo. That''s not how bodies, or good fit, work. A body doesn''t grow evenly in every direction between a Small and a 2XL: shoulders, bust, waist, and hip each grow at their own rate, and sleeve length doesn''t grow at the same rate as chest width.</p>
<p>Pattern grading is the process of moving pattern points outward or inward by specific, size-by-size amounts, called grade rules, so that every size keeps the same silhouette and proportion as the base size, just at a different scale. Done correctly, a 2XL looks and fits like a bigger version of the Medium. Done as uniform scaling, it looks stretched: wider everywhere by the same amount, including places that shouldn''t have grown that much.</p>
<h2>Where self-taught grading usually breaks</h2>
<ul>
<li><strong>One grade rule for the whole body.</strong> Chest, waist, hip, shoulder, and sleeve each need their own grade increment, not one blanket number applied everywhere.</li>
<li><strong>Ignoring ease.</strong> The amount of room built into a garment beyond body measurement (ease) doesn''t always scale linearly either. Outerwear and fitted knitwear need different grading logic even at the same body sizes.</li>
<li><strong>Grading from the wrong base size.</strong> Grading out from your smallest size compounds differently than grading from a mid-range base. Most professional grading starts from a true middle size and grades both up and down from there.</li>
<li><strong>Skipping a fit check per size.</strong> A grade rule that works between Small and Medium doesn''t guarantee it still works cleanly between XL and 2XL. Extremes need their own sanity check, not just the same math repeated.</li>
</ul>
<div class="article__callout"><strong>Why this matters commercially</strong>Inconsistent grading is one of the most common causes of size-specific returns, the kind where your reviews say "true to size" for one size and "runs big" or "runs small" for another, on the exact same style.</div>
<h2>How grading fits into the bigger production picture</h2>
<p>Grading doesn''t happen in isolation. It''s one stage in a chain: a base pattern is drafted, graded across the full range, tested for fit at the extremes, then documented into a tech pack with a POM sheet covering every size. Skip the grading step, or rush it, and every downstream document, the POM sheet, the factory''s cutting markers, your own size chart, inherits the error.</p>
<p>This is also why grading is hard to do well from a single reference photo or a competitor''s size chart. Real grading needs the actual base pattern, a defined fit intent, and grade rules chosen for the specific garment category, not copied from a different style.</p>
<h2>The practical takeaway</h2>
<p>If you''re expanding from a one-size or limited-run product into a full size range, budget for real grading, not just a resize. It''s a small line item next to the cost of reprinting labels, reworking a bulk order, or absorbing returns on a size that quietly doesn''t fit.</p>',
  'Pattern Making', 'pattern-making', 'Styliqa Studio',
  'https://styliqa.studio/assets/img/blog/cover-pattern-grading-101.jpg',
  'Graded pattern pieces with measuring tape on dark studio surface',
  '4 min read', 'published',
  'Pattern Grading 101: Full Size Ranges | Styliqa',
  'Why pattern grading is proportion, not scaling — and where most self-taught size ranges quietly break.',
  'Pattern Grading 101: How One Size Becomes a Full Size Range',
  'Why grading is proportion, not just scaling, and where most self-taught size ranges quietly break.',
  'https://styliqa.studio/assets/img/og/og-blog-pattern-grading-101.jpg',
  '2026-07-22T10:00:00Z'
)
on conflict (slug) do nothing;

select id, slug, status, category, published_at from styliqa_blog_posts order by published_at desc;
