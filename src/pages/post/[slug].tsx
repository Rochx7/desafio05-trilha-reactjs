import { GetStaticPaths, GetStaticProps } from 'next';

import { getPrismicClient } from '../../services/prismic';

import Prismic from '@prismicio/client';
import { RichText } from 'prismic-dom';


import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';


import Header from '../../components/Header'
import Head from 'next/head';
import { useRouter } from 'next/router';

import { ptBR } from 'date-fns/locale';
import { format } from 'date-fns';

import { FiCalendar, FiClock, FiUser } from 'react-icons/fi'


interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps): JSX.Element {
  const { author, banner, content, title } = post.data;


  const readTime = post.data.content.reduce((sumTotal, content) => {
    const textTime = RichText.asText(content.body).split(' ').length;
    return Math.ceil(sumTotal + textTime / 200);
  }, 0);



  const router = useRouter();

  if (router.isFallback) {
    return <h1>Carregando...</h1>
  }

  const formatedDate = format(
    new Date(post.first_publication_date),
    'dd MMM yyyy',
    {
      locale: ptBR
    }
  )


  return (


    <>
      <Head> <title> {`${title}| spacetraveling`}</title></Head>

      <Header />
      <img className={styles.banner} src={banner.url} alt="imagem" />
      <main className={commonStyles.container}>
        <div className={styles.container}>
          <div className={styles.content}>
            <h1>{title}</h1>
            <ul>
              <li>
                <FiCalendar />
                {formatedDate}
              </li>
              <li>
                <FiUser />
                {author}
              </li>
              <li>
                <FiClock />
                {`${readTime} min`}
              </li>
            </ul>
          </div>

          {content.map(content => (
            <article key={content.heading}>
              <h2>{content.heading}</h2>
              <div
                className={styles.postContent}
                dangerouslySetInnerHTML={{ __html: RichText.asHtml(content.body) }}
              />
            </article>
          ))}

        </div>
      </main>
    </>
  )
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query([
    Prismic.Predicates.at('document.type', 'posts'),
  ]);

  const paths = posts.results.map(post => {
    return {
      params: {
        slug: post.uid,
      }
    }
  })

  return {
    paths,
    fallback: true,
  }
};

export const getStaticProps: GetStaticProps = async context => {
  const prismic = getPrismicClient();
  const { slug } = context.params
  const response = await prismic.getByUID('posts', String(slug), {});

  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    last_publication_date: response.last_publication_date,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      author: response.data.author,
      banner: {
        url: response.data.banner.url,
      },
      content: response.data.content.map(content => {
        return {
          heading: content.heading,
          body: content.body.map(body => {
            return {
              text: (body.text),
              type: (body.type),
              spans: [...body.spans],
            };
          }),
        };
      }),
    },
  };

  return {
    props: {
      post,
    },
  }
};
