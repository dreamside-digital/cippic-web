const qs = require('qs');

export default async function getLayoutData(locale="en") {
  const layoutQuery = qs.stringify(
    {
      populate: [
        'favicon.media', 
        'main_logo.media', 
        'alternate_logo.media', 
        'uottawa_logo.media',
        'header_links',
        'footer_links',
        'social_media_links',
        'default_share_image.media'
      ],
      locale: locale
    },
    {
      encodeValuesOnly: true, // prettify URL
    }
  );

  const categoriesQuery = qs.stringify(
    {
      locale: locale,
      sort: "name:asc",
      populate: ['icon'],
      publicationState: process.env.NEXT_PUBLIC_PREVIEW_MODE ? 'preview' : 'live'
    },
    {
      encodeValuesOnly: true, // prettify URL
    }
  );

  const contentTypesQuery = qs.stringify(
    {
      locale: locale,
      sort: "name:asc",
      publicationState: process.env.NEXT_PUBLIC_PREVIEW_MODE ? 'preview' : 'live'
    },
    {
      encodeValuesOnly: true, // prettify URL
    }
  );

	const layoutRes = await fetch(`${process.env.NEXT_PUBLIC_STRAPI_DOMAIN}/api/layout?${layoutQuery}`)
	const layoutJson = await layoutRes.json()
	const layout = { ...layoutJson.data.attributes }

	const categoriesRes = await fetch(`${process.env.NEXT_PUBLIC_STRAPI_DOMAIN}/api/categories?${categoriesQuery}`)
	const categoriesJson = await categoriesRes.json()
	const categories = categoriesJson.data.map(t => ({ id: t.id, ...t.attributes}))

	const contentTypesRes = await fetch(`${process.env.NEXT_PUBLIC_STRAPI_DOMAIN}/api/content-types?${contentTypesQuery}`)
	const contentTypesJson = await contentTypesRes.json()
	const contentTypes = contentTypesJson.data.map(t => ({ id: t.id, ...t.attributes}))

  const translationsRes = await fetch(`${process.env.NEXT_PUBLIC_STRAPI_DOMAIN}/api/translation?locale=${locale}`)
  const translationJson = await translationsRes.json()
  const translation = { id: translationJson.data.id, ...translationJson.data.attributes} 

	return { layout, contentTypes, categories, translation }
}

