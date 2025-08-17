import React from 'react'
import { HelpCircle, Phone, Mail, MessageCircle } from 'lucide-react'

const HelpPage: React.FC = () => {
  const faqs = [
    {
      question: 'Je, michezo ni bure?',
      answer: 'Ndio, michezo yote tunayotoa ni bure kabisa. Hakuna malipo yoyote.'
    },
    {
      question: 'Jinsi ya kupakua michezo?',
      answer: 'Bonyeza kitufe cha "Pakua" kwenye mchezo unaotaka na fuata maagizo.'
    },
    {
      question: 'Je, michezo ni salama?',
      answer: 'Ndio, michezo yetu yamepimwa na ni salama kwa simu zako.'
    },
    {
      question: 'Nini kifanyike ikiwa mchezo haujaanza?',
      answer: 'Hakikisha una nafasi ya kutosha kwenye simu yako na internet ni nzuri.'
    }
  ]

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-black mb-4 flex items-center justify-center">
          <HelpCircle className="mr-2" size={28} />
          Msaada na Maswali
        </h2>
        <p className="text-gray-600">
          Pata msaada kuhusu matumizi ya app na michezo
        </p>
      </div>

      {/* Contact Options */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <h3 className="text-lg font-semibold text-black mb-4">Wasiliana Nasi</h3>
        <div className="space-y-3">
          <a 
            href="tel:+255123456789" 
            className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Phone className="w-5 h-5 text-red-600 mr-3" />
            <div>
              <div className="font-medium text-black">Piga Simu</div>
              <div className="text-sm text-gray-600">+255 123 456 789</div>
            </div>
          </a>
          
          <a 
            href="mailto:info@tonygamingtz.com" 
            className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Mail className="w-5 h-5 text-red-600 mr-3" />
            <div>
              <div className="font-medium text-black">Barua Pepe</div>
              <div className="text-sm text-gray-600">info@tonygamingtz.com</div>
            </div>
          </a>
          
          <a 
            href="https://wa.me/255123456789" 
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <MessageCircle className="w-5 h-5 text-red-600 mr-3" />
            <div>
              <div className="font-medium text-black">WhatsApp</div>
              <div className="text-sm text-gray-600">Tuma ujumbe</div>
            </div>
          </a>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <h3 className="text-lg font-semibold text-black mb-4">Maswali Yanayoulizwa Mara Kwa Mara</h3>
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="border-b border-gray-200 pb-4 last:border-b-0">
              <h4 className="font-medium text-black mb-2">{faq.question}</h4>
              <p className="text-gray-600 text-sm">{faq.answer}</p>
            </div>
          ))}
        </div>
      </div>

      {/* App Info */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h3 className="font-semibold text-red-800 mb-2">Kuhusu TonyGamingTZ</h3>
        <p className="text-red-700 text-sm">
          TonyGamingTZ ni jukwaa la michezo ya Tanzania. Tunalenga kutoa michezo bora 
          na ya hali ya juu kwa wachezaji wote wa Tanzania na Afrika Mashariki.
        </p>
      </div>
    </div>
  )
}

export default HelpPage