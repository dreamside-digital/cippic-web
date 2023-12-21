import Image from "next/image"
import ButtonLink from '@/components/elements/ButtonLink'


export default function FancyHeader({ before_title, title, subtitle, byline, iconSrc, button, tags, image, children }) {
    return (
      <section className="section-md bg-two">
        <div className="container position-relative">
          <div className="row">
            <div className={`${image ? "col-12 col-md-8" : "col-12"}`}>
                {tags && <div className="tags">
                    <i className="icon-folder" />
                    {tags}
                </div>}
                <div className="title-with-icon">
                  <h1 className="m-0 underline">{title}</h1>
                </div>
                {byline && <p>{byline}</p>}
                {subtitle && <p className="text-lg mb-4">{subtitle}</p>}
                {button && <div className="mr_top_40"><ButtonLink href={button.button_link} target="_blank">{button.button_text}</ButtonLink></div>}
                {children}
            </div>
            {
              image && 
              <div className="col-12 col-md-4 mb-3 header-image">
                <Image 
                  className="highlight-border img-fit" 
                  src={`${process.env.NEXT_PUBLIC_STRAPI_DOMAIN}${image.formats.small.url}`} 
                  width={image.formats.small.width} 
                  height={image.formats.small.height} 
                  alt={image.alternativeText} 
                />
              </div>
            }
          </div>
        </div>
      </section>
    )
}
