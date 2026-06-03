# Adobe Post-Production Workflow (real MCP-usable steps)

Adobe's connected tools are **edit/finish**, not generation. After clips/stills exist, use Adobe for the premium polish — these all work via the Adobe creativity connector:

## Stills grade (Photoshop/Lightroom tools)
Per scene still: `image_apply_auto_tone` -> `image_adjust_color_temperature` (warm skin scenes) -> `image_adjust_hsl` (pull blues/cyans, keep greens toward #9aa893) -> `image_adjust_highlights` (soft roll-off) -> `image_add_grain` (4–6%). Verify with `asset_inline_preview`.

## Logo / vector
`image_vectorize` on `whitedot-symbol`/`limex-wordmark` if a crisp SVG is needed for the end lockup; `document_render_vector` to export.

## Video finishing (Premiere tools)
- `video_resize` — produce the **9:16** social cut from the 16:9 master (set target 1080x1920) and any platform sizes.
- `video_create_quick_cut` — assemble a fast highlight/teaser from the 8 clips for socials.
- `media_enhance_speech` — clean the VO recording before the final mix.
- `media_summarize` — auto-summarize the cut for a caption/description.

## Express
`search_design` a 9:16 social template -> `change_background_color` to #181b19 -> `fill_text` the tagline (Boska) -> `animate_design` for a simple motion social post.

## Not available in this connector
Image/video **generation**, generative fill, AI object removal — do those in Kling/Firefly web or Photoshop desktop. (Exception: `image_generative_expand` for extending a frame's canvas to reframe 16:9 -> 9:16.)
