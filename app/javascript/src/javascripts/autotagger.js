import { splitWords } from './utility';

const Autotagger = {};

// Request fresh AI tags for a media asset from the autotagger service, update
// the AI tags cache, and add the results to the tag input field.
//
// @param {string|number} mediaAssetId - The ID of the media asset to autotag.
// @param {number} confidence - The minimum confidence threshold (0-100) for tags to be added.
Autotagger.autotag = async function(mediaAssetId, confidence) {
  const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;

  const response = await fetch(`/media_assets/${mediaAssetId}/autotag`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "X-CSRF-Token": csrfToken,
    },
    body: JSON.stringify({ confidence: Number(confidence) }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || `Autotagger failed (HTTP ${response.status})`);
  }

  const field = document.getElementById("post_tag_string");
  if (!field) return { added: 0 };

  const currentTags = new Set(splitWords(field.value.toLowerCase()));
  const newTags = (data.tags || []).filter(t => !currentTags.has(t.toLowerCase()));

  if (newTags.length > 0) {
    field.value = (field.value.trimEnd() + " " + newTags.join(" ")).trimStart() + " ";
    $(field).trigger("input");
    $(field).trigger("danbooru:update-tag-counter");
  }

  // Refresh the AI tags column in the related tags panel.
  const container = document.getElementById("related-tags-container");
  if (container) {
    const mid = container.dataset.mediaAssetId;
    if (mid) {
      $.get("/related_tag.js", { user_tags: true, media_asset_id: mid });
    }
  }

  return { added: newTags.length };
};

export default Autotagger;
