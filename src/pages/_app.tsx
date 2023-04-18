import { useApollo } from '@/src/lib/apollo';
import '@/src/styles/globals.css';
import { ApolloProvider } from '@apollo/client';
import type { AppProps } from 'next/app';
import HeadComponent from '../components/head';
import { useEffect, useState } from 'react';
import Footer from '../components/footer';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { AnimatePresence, motion } from 'framer-motion';
import Image from 'next/image';
import Loader from '../components/Loader';

const Navbar = dynamic(() => import('../components/navbar'), { ssr: false });

export default function App({
  Component,
  pageProps: { session, ...pageProps },
}: AppProps) {
  const apolloClient = useApollo(pageProps.initialApolloState);
  const [isLoading, setLoading] = useState<boolean>(false);
  const router = useRouter();
  const variants = {
    initialState: {
      opacity: 0,
      translateY: '100px',
    },
    animateState: {
      opacity: 1,
      translateY: '0%',
    },
    exitState: {
      opacity: 0,
      translateY: '-100px',
    },
  };

  useEffect(() => {
    setLoading(true);
    setTimeout(() => setLoading(false), 2500);
  }, []);

  return (
    <ApolloProvider client={apolloClient}>
      <HeadComponent
        title="Incridea"
        description="Official Website of Incridea 2023, National level techno-cultural fest, NMAMIT, Nitte. Innovate. Create. Ideate."
      />
      <AnimatePresence>{isLoading && <Loader />}</AnimatePresence>
      <div className="bg-gradient-to-bl  from-[#41acc9]  via-[#075985] to-[#2d6aa6]">
        {(
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white">
            <Image
              src={'/assets/png/logo.png'}
              alt="loader"
              width={300}
              height={300}
            />
            <h1 className={`titleFont text-xl md:text-3xl text-center`}>
              Tides of Change
            </h1>
          </div>
        )}
        {!isLoading && <Navbar />}
        <AnimatePresence mode="wait">
          <motion.main
            key={router.route}
            initial="intialState"
            animate="animateState"
            exit="exitState"
            transition={{ duration: 0.8 }}
            variants={variants}
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
              className="min-h-screen"
            >
              <Component setLoading={setLoading} {...pageProps} />
            </motion.div>
          </motion.main>
        </AnimatePresence>
        <Footer />
      </div>
    </ApolloProvider>
  );
}
