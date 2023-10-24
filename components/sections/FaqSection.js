import Link from "next/link"
import Fade from 'react-reveal/Fade';
import ReactMarkdown from 'react-markdown'
import ArticleCard from "@/components/elements/ArticleCard"
import {
    Accordion,
    AccordionItem,
    AccordionItemHeading,
    AccordionItemButton,
    AccordionItemPanel,
} from 'react-accessible-accordion';


export default function FaqSection({ FAQs, before_title, title, subtitle, background_colour }) {
    return (
        <section className={`bg-${background_colour}`}>
            <div className="container container-reading section-default ">
                <div className="row">
                    <div className="col-12">
                        <div className="title_sections">
                            {before_title && <div className="before_title">{before_title}</div>}
                            {title && <h2>{title}</h2>}
                            {subtitle && <p className="text-lg">{subtitle}</p>}
                        </div>
                        <Accordion 
                            allowMultipleExpanded 
                            allowZeroExpanded
                        >
                            { FAQs.map(faq => {
                                return (
                                    <AccordionItem key={faq.id}>
                                        <AccordionItemHeading>
                                            <AccordionItemButton>
                                                <span className="caret"><i className="icon-arrow-down-sign-to-navigate" /></span>
                                                {faq.Header}
                                            </AccordionItemButton>
                                        </AccordionItemHeading>
                                        <AccordionItemPanel>
                                            <ReactMarkdown>{faq.Body}</ReactMarkdown>
                                        </AccordionItemPanel>
                                    </AccordionItem>
                                )
                            })}
                        </Accordion>
                    </div>
                </div>
            </div>
        </section>
    )
}