import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function PrivacyPolicy() {
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Privacy Policy</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">Last Updated: October 16, 2025</p>

          <div className="prose dark:prose-invert max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">1. Information We Collect</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Personal Information</h3>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
                <li><strong>Account Information:</strong> Name, email address, password (encrypted)</li>
                <li><strong>Profile Data:</strong> Belt rank, gym affiliation, training preferences</li>
                <li><strong>User IDs:</strong> Internal user ID and authentication tokens</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 mt-4">Training Data</h3>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
                <li><strong>Class Records:</strong> Training sessions, techniques learned, rolling partners</li>
                <li><strong>Notes:</strong> User-created technique notes, video links, training insights</li>
                <li><strong>Progress Tracking:</strong> Belt promotions, stripes, weekly goals</li>
                <li><strong>Competition Data:</strong> Game plans and strategy notes</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 mt-4">Subscription Information</h3>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
                <li><strong>Subscription Status:</strong> Current plan, subscription dates</li>
                <li><strong>Payment Processing:</strong> Handled securely by Stripe, Google Play, or Apple (we do not store payment card details)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">2. How We Use Your Information</h2>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
                <li>Provide and maintain BJJ Jits Journal services</li>
                <li>Track your training progress and achievements</li>
                <li>Enable community features (shared notes, gym communities)</li>
                <li>Process subscription payments and manage account access</li>
                <li>Send service-related emails (welcome, password reset)</li>
                <li>Improve app functionality and user experience</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">3. Data Sharing</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We DO NOT sell your personal data to third parties. We only share data with:
              </p>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
                <li><strong>Payment Processors:</strong> Stripe, Google Play, Apple (for subscription processing)</li>
                <li><strong>Cloud Services:</strong> Supabase (database hosting), Render (application hosting)</li>
                <li><strong>Community Features:</strong> Notes you choose to share are visible to your gym community or public community</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">4. Data Security</h2>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
                <li><strong>Encryption in Transit:</strong> All data transmitted using HTTPS/TLS encryption</li>
                <li><strong>Encryption at Rest:</strong> Database stored on secure Supabase infrastructure</li>
                <li><strong>Password Security:</strong> Passwords are hashed using bcrypt</li>
                <li><strong>Access Controls:</strong> Role-based permissions for admin features</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">5. Your Rights</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">You have the right to:</p>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
                <li><strong>Access Your Data:</strong> View all personal information we have about you</li>
                <li><strong>Update Your Data:</strong> Modify your profile, training records, and preferences</li>
                <li><strong>Delete Your Data:</strong> Request complete account and data deletion (see Settings)</li>
                <li><strong>Export Your Data:</strong> Download your training records and notes</li>
                <li><strong>Control Sharing:</strong> Choose which notes to share publicly or with your gym</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">6. Data Retention</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We retain your data for as long as your account is active. When you delete your account:
              </p>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
                <li>All personal information is permanently deleted within 30 days</li>
                <li>Training records, notes, and progress data are permanently removed</li>
                <li>Shared community notes are anonymized or deleted based on your preference</li>
                <li>Subscription records are retained for legal/tax compliance (7 years)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">7. Children's Privacy</h2>
              <p className="text-gray-700 dark:text-gray-300">
                BJJ Jits Journal is not intended for children under 13. We do not knowingly collect data from children under 13. 
                If you believe a child has provided us with personal information, please contact us immediately.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">8. International Users</h2>
              <p className="text-gray-700 dark:text-gray-300">
                Your data may be processed and stored in Australia, United States, or other countries where our service providers operate. 
                By using BJJ Jits Journal, you consent to this transfer of data.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">9. Changes to Privacy Policy</h2>
              <p className="text-gray-700 dark:text-gray-300">
                We may update this Privacy Policy from time to time. We will notify you of significant changes via email or in-app notification. 
                Continued use of the service after changes constitutes acceptance of the updated policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">10. Contact Us</h2>
              <p className="text-gray-700 dark:text-gray-300">
                For privacy-related questions, data deletion requests, or concerns, contact us at:
              </p>
              <p className="text-gray-700 dark:text-gray-300 mt-2">
                <strong>Email:</strong> bjjjitsjournal@gmail.com
              </p>
            </section>

            <section className="mt-8 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h3 className="text-xl font-semibold text-blue-900 dark:text-blue-200 mb-2">Data Deletion</h3>
              <p className="text-blue-800 dark:text-blue-300">
                To delete your account and all associated data, go to Settings → Delete Account. 
                This action is permanent and cannot be undone.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
