import { Link } from 'react-router-dom';

const HeroSection = () => {
  return (
    <section
      id="home"
      className="min-h-screen flex items-center justify-center relative overflow-hidden pt-16 mt-8"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="glass rounded-3xl p-10 md:p-17">

          {/* Main Headline */}
          <h1 className="font-title text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
            Verified skills for the{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#8B11D1] to-[#F743EE]">
              Digital age
            </span>
          </h1>

          {/* Subheadline */}
          <p className="font-body text-xl md:text-1xl text-muted-foreground mb-0 max-w-4xl mx-auto leading-relaxed">
            HackChain is the trusted standard for blockchain-based certification.
          </p>
          <p className="font-body text-xl md:text-1xl text-muted-foreground mb-24 max-w-4xl mx-auto leading-relaxed">
            Verify skills, issue NFT certificates, and connect talent with real opportunities.
          </p>

          {/* Infrastructure Section */}
          <div>
            <p className="font-title text-4xl md:text-6xl lg:text-3xl font-bold mb-8 leading-tight">
              Built on trusted Web3 infrastructure
            </p>

            <div className="flex flex-wrap justify-center items-start gap-20">

              {/* Polygon */}
              <div className="flex flex-col items-center gap-4">
                <img
                  src="/images/polygon.png"
                  alt="Polygon"
                  className="h-24 md:h-28"
                />
                <span className="font-body text-sm text-white/80">
                  Polygon
                </span>
              </div>

              {/* Pinata */}
              <div className="flex flex-col items-center gap-4">
                <img
                  src="/images/pinata.png"
                  alt="Pinata Cloud"
                  className="h-24 md:h-28"
                />
                <span className="font-body text-sm text-white/80">
                  Pinata Cloud
                </span>
              </div>

              {/* OpenSea */}
              <div className="flex flex-col items-center gap-4">
                <img
                  src="/images/opensea.png"
                  alt="OpenSea"
                  className="h-24 md:h-28"
                />
                <span className="font-body text-sm text-white/80">
                  OpenSea
                </span>
              </div>

              {/* MetaMask */}
              <div className="flex flex-col items-center gap-4">
                <img
                  src="/images/metamask.png"
                  alt="MetaMask"
                  className="h-24 md:h-28"
                />
                <span className="font-body text-sm text-white/80">
                  MetaMask
                </span>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default HeroSection;
