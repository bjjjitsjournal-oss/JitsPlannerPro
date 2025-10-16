import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/settings">
          <button className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6">
            <ArrowLeft className="w-4 h-4" />
            Back to Settings
          </button>
        </Link>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Terms of Service</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">Last Updated: October 16, 2025</p>

          <div className="prose dark:prose-invert max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-700 dark:text-gray-300">
                By accessing or using BJJ Jits Journal ("the Service"), you agree to be bound by these Terms of Service. 
                If you do not agree to these terms, please do not use the Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">2. Service Description</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                BJJ Jits Journal is a training companion application for Brazilian Jiu-Jitsu practitioners that provides:
              </p>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
                <li>Class and technique tracking</li>
                <li>Training notes and video integration</li>
                <li>Belt progression monitoring</li>
                <li>Competition game plan creation</li>
                <li>Community features for sharing insights</li>
                <li>Gym community management</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">3. Account Registration</h2>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
                <li>You must provide accurate and complete information during registration</li>
                <li>You are responsible for maintaining the confidentiality of your account credentials</li>
                <li>You must be at least 13 years old to use the Service</li>
                <li>One person may not maintain multiple free accounts</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">4. Subscription Plans</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Free Tier</h3>
              <p className="text-gray-700 dark:text-gray-300">
                Basic features including class tracking, notes, and belt progression.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 mt-4">BJJ Enthusiast ($14.99 AUD/month)</h3>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
                <li>Advanced technique tracking and video integration</li>
                <li>Unlimited notes and community sharing</li>
                <li>Competition game plan tools</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 mt-4">Gym Pro ($29.99 AUD/month)</h3>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
                <li>All Enthusiast features</li>
                <li>Gym community management (requires admin approval)</li>
                <li>Private gym note sharing</li>
                <li>Priority support</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 mt-4">Billing</h3>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
                <li>Subscriptions are billed monthly in advance</li>
                <li>Prices are in Australian Dollars (AUD)</li>
                <li>You can cancel anytime from your account settings</li>
                <li>No refunds for partial months</li>
                <li>Access continues until the end of the current billing period after cancellation</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">5. User Conduct</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">You agree NOT to:</p>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
                <li>Post offensive, abusive, or inappropriate content</li>
                <li>Harass or bully other users</li>
                <li>Share copyrighted content without permission</li>
                <li>Attempt to hack, disrupt, or abuse the Service</li>
                <li>Create fake accounts or impersonate others</li>
                <li>Use the Service for any illegal purposes</li>
                <li>Share spam or promotional content</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">6. Content Ownership</h2>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
                <li><strong>Your Content:</strong> You retain ownership of all training data, notes, and content you create</li>
                <li><strong>License to Us:</strong> By sharing content publicly or with your gym, you grant us a license to display and distribute that content within the Service</li>
                <li><strong>Our Content:</strong> The Service interface, design, and features are our intellectual property</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">7. Community Guidelines</h2>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
                <li>Be respectful and supportive of other practitioners</li>
                <li>Share genuine training insights and techniques</li>
                <li>Give credit when sharing others' techniques or ideas</li>
                <li>Report inappropriate content to admins</li>
                <li>Respect gym communities and their privacy</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">8. Moderation</h2>
              <p className="text-gray-700 dark:text-gray-300">
                We reserve the right to remove content or suspend accounts that violate these terms. 
                Admins may moderate community content. Decisions are final.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">9. Medical Disclaimer</h2>
              <p className="text-gray-700 dark:text-gray-300">
                BJJ Jits Journal is NOT medical advice. Training in Brazilian Jiu-Jitsu carries inherent risks. 
                Consult with qualified instructors and medical professionals before beginning or continuing training. 
                We are not responsible for injuries sustained during training.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">10. Service Availability</h2>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
                <li>We strive for 99.9% uptime but cannot guarantee uninterrupted service</li>
                <li>Scheduled maintenance will be announced in advance when possible</li>
                <li>We are not liable for data loss due to service interruptions (though we maintain regular backups)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">11. Limitation of Liability</h2>
              <p className="text-gray-700 dark:text-gray-300">
                BJJ Jits Journal is provided "as is" without warranties. We are not liable for any damages arising from use of the Service, 
                including but not limited to data loss, training injuries, or financial losses. Maximum liability is limited to the amount 
                you paid for the Service in the past 12 months.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">12. Termination</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We may terminate or suspend your account for violations of these terms. You may delete your account anytime from Settings.
              </p>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
                <li>Upon termination, your access to paid features ends immediately</li>
                <li>No refunds for remaining subscription time</li>
                <li>Your data will be deleted according to our Privacy Policy</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">13. Changes to Terms</h2>
              <p className="text-gray-700 dark:text-gray-300">
                We may update these Terms of Service. Significant changes will be communicated via email or in-app notification. 
                Continued use after changes constitutes acceptance.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">14. Governing Law</h2>
              <p className="text-gray-700 dark:text-gray-300">
                These terms are governed by the laws of Australia. Disputes shall be resolved in Australian courts.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">15. Contact</h2>
              <p className="text-gray-700 dark:text-gray-300">
                For questions about these Terms of Service, contact us at:
              </p>
              <p className="text-gray-700 dark:text-gray-300 mt-2">
                <strong>Email:</strong> bjjjitsjournal@gmail.com
              </p>
            </section>

            <section className="mt-8 p-6 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <h3 className="text-xl font-semibold text-red-900 dark:text-red-200 mb-2">Important Notice</h3>
              <p className="text-red-800 dark:text-red-300">
                By using BJJ Jits Journal, you acknowledge that Brazilian Jiu-Jitsu training involves physical contact and risk of injury. 
                Always train under qualified instruction and follow safety protocols.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
