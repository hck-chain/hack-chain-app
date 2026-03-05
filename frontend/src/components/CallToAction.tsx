import { Rocket } from 'lucide-react';

const CallToAction = () => {
  return (
    <section id="dao" className="pb-20 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="glass rounded-3xl p-10 md:p-20 text-center animate-in fade-in duration-700 slide-in-from-bottom">
          <div className="max-w-4xl mx-auto">

            {/* Headline */}
            <h2 className="font-title text-4xl md:text-6xl font-bold mb-6 leading-tight animate-in fade-in duration-700 delay-200 slide-in-from-top">
              Start building your{' '}
              <span className="gradient-text">identity</span> today
            </h2>

            {/* Description */}
            <p className="font-body text-xl md:text-2xl text-muted-foreground mb-16 leading-relaxed animate-in fade-in duration-700 delay-400 slide-in-from-bottom">
              Join thousands of professionals adopting blockchain-verified credentials
              to build trusted, verifiable, and global digital identities.
            </p>

            {/* Trust Highlights */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="glass rounded-xl p-6 animate-in fade-in duration-700 delay-600 slide-in-from-left">
                <div className="font-title text-2xl font-bold gradient-text">Free</div>
                <div className="font-body text-muted-foreground">Registration</div>
              </div>

              <div className="glass rounded-xl p-6 animate-in fade-in duration-700 delay-700 slide-in-from-bottom">
                <div className="font-title text-2xl font-bold gradient-text">24/7</div>
                <div className="font-body text-muted-foreground">Verification</div>
              </div>

              <div className="glass rounded-xl p-6 animate-in fade-in duration-700 delay-800 slide-in-from-bottom">
                <div className="font-title text-2xl font-bold gradient-text">Instant</div>
                <div className="font-body text-muted-foreground">NFT Issuance</div>
              </div>

              <div className="glass rounded-xl p-6 animate-in fade-in duration-700 delay-900 slide-in-from-right">
                <div className="font-title text-2xl font-bold gradient-text">Global</div>
                <div className="font-body text-muted-foreground">Recognition</div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
};

export default CallToAction;
