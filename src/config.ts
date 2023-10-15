import type { Site, SocialObjects } from "./types";

export const SITE: Site = {
  website: "https://abdullah.hilson.dev/",
  author: "Abdullah Hilson",
  desc: "My personal website",
  title: "Abdullah Hilson",
  ogImage: "astropaper-og.jpg",
  lightAndDarkMode: true,
  postPerPage: 3,
};

export const LOCALE = ["en-EN"]; // set to [] to use the environment default

export const LOGO_IMAGE = {
  enable: false,
  svg: true,
  width: 216,
  height: 46,
};

export const SOCIALS: SocialObjects = [
  {
    name: "Github",
    href: "https://github.com/abumalick",
    linkTitle: ` ${SITE.title} on Github`,
    active: true,
  },
  {
    name: "LinkedIn",
    href: "https://www.linkedin.com/in/abdullah-hilson-565a1455/",
    linkTitle: `${SITE.title} on LinkedIn`,
    active: true,
  },
  {
    name: "Mail",
    href: "mailto:abdullah.hilson@gmail.com",
    linkTitle: `Send an email to ${SITE.title}`,
    active: false,
  },
];
