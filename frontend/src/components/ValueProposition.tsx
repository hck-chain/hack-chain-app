import { ArrowRight, User, Award, Building } from 'lucide-react';

const ValueProposition = () => {
  return (
    <section id="community" className="pb-20 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section Header */}
        <div className="text-center mb-16 animate-in fade-in duration-700 slide-in-from-top">
          <h2 className="font-title text-4xl md:text-5xl font-bold mb-4">
            How It <span className="gradient-text">Works</span>
          </h2>

          <p className="font-body text-xl text-muted-foreground max-w-3xl mx-auto">
            From learning to employment — your journey in the Web3 professional certification ecosystem
          </p>
        </div>

        {/* Flow Container */}
        <div className="glass rounded-3xl p-8 md:p-12 animate-in fade-in duration-700 delay-200 slide-in-from-bottom">
          <div className="flex flex-col lg:flex-row items-center justify-between space-y-8 lg:space-y-0 lg:space-x-8">

            {/* Step 1 */}
            <div className="flex-1 text-center group animate-in fade-in duration-700 delay-400 slide-in-from-left">
              <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <User className="w-12 h-12 text-white" />
              </div>

              <h3 className="font-title text-2xl font-bold mb-4 gradient-text">
                Student
              </h3>

              <p className="font-body text-muted-foreground">
                Complete professional courses and pass rigorous assessments in your field of expertise
              </p>
            </div>

            {/* Arrow */}
            <div className="hidden lg:block animate-in fade-in duration-700 delay-500">
              <ArrowRight className="w-8 h-8 text-primary animate-pulse-neon" />
            </div>

            {/* Step 2 */}
            <div className="flex-1 text-center group animate-in fade-in duration-700 delay-600 slide-in-from-bottom">
              <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 neon-glow">
                <Award className="w-12 h-12 text-white" />
              </div>

              <h3 className="font-title text-2xl font-bold mb-4 gradient-text">
                NFT Certificate
              </h3>

              <p className="font-body text-muted-foreground">
                Receive a blockchain-verified NFT certificate that proves your expertise
              </p>
            </div>

            {/* Arrow */}
            <div className="hidden lg:block animate-in fade-in duration-700 delay-700">
              <ArrowRight className="w-8 h-8 text-primary animate-pulse-neon" />
            </div>

            {/* Step 3 */}
            <div className="flex-1 text-center group animate-in fade-in duration-700 delay-800 slide-in-from-right">
              <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Building className="w-12 h-12 text-white" />
              </div>

              <h3 className="font-title text-2xl font-bold mb-4 gradient-text">
                Recruiter
              </h3>

              <p className="font-body text-muted-foreground">
                Employers instantly verify credentials and hire top verified talent
              </p>
            </div>
          </div>

          {/* Trust Line */}
          <div className="mt-12 text-center animate-in fade-in duration-700 delay-1000 slide-in-from-bottom">
            <div className="glass rounded-xl p-6 inline-block">
              <p className="font-body text-lg text-muted-foreground">
                <span className="gradient-text font-semibold">Tamper-proof</span> •
                <span className="gradient-text font-semibold"> Instant verification</span> •
                <span className="gradient-text font-semibold"> Global recognition</span>
              </p>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default ValueProposition;
