import Layout from "@/components/layout/Layout"
import Articles from "@/components/sections/Articles"
import Topics from "@/components/sections/Topics"
import Students from "@/components/sections/Students"
import Landing from "@/components/sections/Landing"
import getLayoutData from "@/utils/layout-data"
import { REVALIDATE_SECONDS } from '@/utils/constants'

const qs = require('qs');


export const getStaticProps = async ({ locale }) => {
    const query = qs.stringify(
      {
        locale: locale,
        populate: '*',
        publicationState: process.env.NEXT_PUBLIC_PREVIEW_MODE ? 'preview' : 'live'
      },
      {
        encodeValuesOnly: true, // prettify URL
      }
    );

    const articlesQuery = qs.stringify(
      {
        locale: locale,
        filters: {
            featured_insights: {
              $eq: true,
            },
        },
        sort: "date_published:desc",
        pagination: {
          start: 0,
          limit: 3
        },
        populate: [
          'main_image',
          'categories',
          'content_types'
        ],
        publicationState: process.env.NEXT_PUBLIC_PREVIEW_MODE ? 'preview' : 'live'
      },
      {
        encodeValuesOnly: true, // prettify URL
      }
    );

    const spotlightQuery = qs.stringify(
      {
        locale: locale,
        filters: {
            featured_story: {
              $eq: true,
            },
        },
        pagination: {
          start: 0,
          limit: 1
        },
        sort: "date_published:desc",
        populate: [
          'main_image',
          'categories',
          'content_types'
        ],
        publicationState: process.env.NEXT_PUBLIC_PREVIEW_MODE ? 'preview' : 'live'
      },
      {
        encodeValuesOnly: true, // prettify URL
      }
    );

    const newsQuery = qs.stringify(
      {
        locale: locale,
        filters: {
          featured_story: {
            $null: true
          }
        },
        sort: "date_published:desc",
        pagination: {
          start: 0,
          limit: 3
        },
        populate: [
          'categories',
          'content_types'
        ],
        publicationState: process.env.NEXT_PUBLIC_PREVIEW_MODE ? 'preview' : 'live'
      },
      {
        encodeValuesOnly: true, // prettify URL
      }
    );

    const studentsQuery = qs.stringify(
        {
          locale: locale,
          populate: [
            'student_programs'
          ],
          publicationState: process.env.NEXT_PUBLIC_PREVIEW_MODE ? 'preview' : 'live'
        },
        {
          encodeValuesOnly: true, // prettify URL
        }
      );
    const layout = await getLayoutData(locale)

    const pageRes = await fetch(`${process.env.NEXT_PUBLIC_STRAPI_DOMAIN}/api/home-page?${query}`)
    const pageJson = await pageRes.json()
    const page = pageJson.data.attributes

    const articleRes = await fetch(`${process.env.NEXT_PUBLIC_STRAPI_DOMAIN}/api/articles?${articlesQuery}`)
    const articleJson = await articleRes.json()
    const articles = articleJson.data.map((article) => ({
      id: article.id,
      ...article.attributes
    }))

    const newsRes = await fetch(`${process.env.NEXT_PUBLIC_STRAPI_DOMAIN}/api/articles?${newsQuery}`)
    const newsJson = await newsRes.json()
    const news = newsJson.data.map((article) => ({
      id: article.id,
      ...article.attributes
    }))

    const spotlightRes = await fetch(`${process.env.NEXT_PUBLIC_STRAPI_DOMAIN}/api/articles?${spotlightQuery}`)
    const spotlightJson = await spotlightRes.json()
    const spotlight = spotlightJson.data.length > 0 ? spotlightJson.data[0].attributes : news[0]

    const content = { ...page, articles, spotlight, news }

    return { 
      props: { content, layout },
      revalidate: process.env.NEXT_PUBLIC_PREVIEW_MODE ? REVALIDATE_SECONDS : false 
    }
}

export default function Home({content, layout}) {
  const keyTopics = layout.categories.filter(t => t.featured)

  return (
      <Layout {...layout} seo={content.SEO}> 
          <Landing 
            headline={content.headline}
            before_headline={content.before_headline}
            intro={content.intro}
            insights_heading={content.insights_heading}
            articles={content.news}
            featured_story_heading={content.featured_story_heading}
            latest_news_heading={content.latest_news_heading}
            spotlightArticle={content.spotlight}
          />
          <Articles 
              title={content.articles_section_title}
              subtitle={content.articles_section_subtitle}
              articles={content.articles}
          />
          <Topics 
            title={content.topics_section_title}
            subtitle={content.topics_section_subtitle}
            topics={keyTopics}
          />
          <Students 
              images={content.students_images}
              title={content.students_section_title}
              description={content.students_description}
              programs={content.student_programs}
          />
      </Layout>
  )
}