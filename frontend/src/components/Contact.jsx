import { useState } from 'react';
import {
  trackDemoRequest,
  trackEmailClick,
  trackFormSubmit,
  trackPhoneClick,
} from '../utils/analytics';
import { trackCTAInterest, trackServiceInterest } from '../utils/visitor';

const WHATSAPP_URL = 'https://wa.me/919400230723?text=Hi%2C%20I%20would%20like%20to%20know%20more%20about%20your%20services.';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    organization: '',
    service: '',
    email: '',
    message: ''
  });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState({ type: '', msg: '' });
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const tempErrors = {};
    if (!formData.name.trim()) tempErrors.name = 'Name is required';
    if (!formData.email.trim()) {
      tempErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      tempErrors.email = 'Email is invalid';
    }
    if (!formData.service) tempErrors.service = 'Please select a service';
    if (!formData.message.trim()) tempErrors.message = 'Message is required';
    
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    // Clear validation error when typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setStatus({ type: '', msg: '' });

    try {
      const response = await fetch('https://formspree.io/f/mzdlrvwb', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        trackFormSubmit('contact_form', formData.service || 'unspecified');
        trackDemoRequest(formData.service || 'contact_form');
        trackCTAInterest(`Demo request: ${formData.service || 'unspecified'}`);
        setStatus({ type: 'success', msg: 'Thank you! Your request for a demo has been sent.' });
        setFormData({
          name: '',
          organization: '',
          service: '',
          email: '',
          message: ''
        });
      } else {
        const data = await response.json();
        const serverError = data.errors ? data.errors.map(err => err.message).join(', ') : 'Failed to send submission.';
        setStatus({ type: 'error', msg: serverError });
      }
    } catch {
      setStatus({ type: 'error', msg: 'An error occurred while submitting. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="contact-wrap" id="contact">
      <div className="container">
        <div className="section-head reveal">
          <span className="eyebrow">Get Started</span>
          <h2 className="mt-md text-3xl sm:text-5xl font-extrabold font-heading text-white">What Could Your Business Automate?</h2>
          <p className="text-muted-text text-base mt-2 max-w-xl mx-auto">Let's identify the manual processes, outdated systems and digital gaps slowing your business down.</p>
        </div>
        <div className="contact-grid">
          <div className="contact-card reveal">
            <h3>Request a Demo</h3>
            <p className="mt-sm">Tell us what you want to build.</p>
            
            {status.type === 'success' && (
              <div className="fs-success-msg">{status.msg}</div>
            )}
            {status.type === 'error' && (
              <div className="fs-global-error">{status.msg}</div>
            )}

            <form id="contactForm" onSubmit={handleSubmit}>
              <div className="fields">
                <div className="field">
                  <label htmlFor="name">Name</label>
                  <input 
                    id="name" 
                    name="name" 
                    type="text" 
                    placeholder="Your name" 
                    value={formData.name}
                    onChange={handleInputChange}
                    required 
                  />
                  {errors.name && <span className="fs-field-error">{errors.name}</span>}
                </div>
                
                <div className="field">
                  <label htmlFor="organization">Organization</label>
                  <input 
                    id="organization" 
                    name="organization" 
                    type="text"
                    placeholder="College, institute, startup, or company" 
                    value={formData.organization}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div className="field">
                  <label htmlFor="service">Service Needed</label>
                  <div className="select-wrap">
                    <select 
                      id="service" 
                      name="service" 
                      value={formData.service}
                      onChange={(e) => {
                        handleInputChange(e);
                        trackServiceInterest(e.target.value);
                      }}
                      required
                    >
                      <option value="" disabled>Select a service</option>
                      <option value="Mobile App Development">Mobile App Development</option>
                      <option value="Web & SaaS Platform">Web & SaaS Platform</option>
                      <option value="Enterprise ERP / HRMS">Enterprise ERP / HRMS</option>
                      <option value="AI / Workflow Automation">AI / Workflow Automation</option>
                      <option value="Custom Development">Custom Development</option>
                    </select>
                  </div>
                  {errors.service && <span className="fs-field-error">{errors.service}</span>}
                </div>
                
                <div className="field">
                  <label htmlFor="email">Email</label>
                  <input 
                    id="email" 
                    name="email" 
                    type="email" 
                    placeholder="info@example.com" 
                    value={formData.email}
                    onChange={handleInputChange}
                    required 
                  />
                  {errors.email && <span className="fs-field-error">{errors.email}</span>}
                </div>
                
                <div className="field">
                  <label htmlFor="message">Message</label>
                  <textarea 
                    id="message" 
                    name="message"
                    placeholder="Tell us whether you need a demo, a platform, or a custom software solution." 
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                  ></textarea>
                  {errors.message && <span className="fs-field-error">{errors.message}</span>}
                </div>
              </div>
              
              <div className="contact-actions">
                <button className="btn primary" type="submit" disabled={submitting}>
                  <i className="ri-send-plane-fill" aria-hidden="true"></i>
                  {submitting ? 'Submitting Audit Request...' : 'Get Your Free Digital Efficiency Audit →'}
                </button>
              </div>
            </form>
          </div>
          
          <aside className="contact-side reveal">
            <h3>Get In Touch</h3>
            <p className="mt-sm">Book a demo or discuss a custom platform.</p>
            <div className="trust-line">Secure &bull; Scalable &bull; Reliable</div>
            <div className="contact-list">
              <div className="contact-item">
                <i className="ri-mail-open-line" aria-hidden="true"></i>
                <div>
                  <strong>Email</strong>
                  <div><a href="mailto:info@chromologtechnologies.com" onClick={() => trackEmailClick('info@chromologtechnologies.com')}>info@chromologtechnologies.com</a></div>
                </div>
              </div>
              <div className="contact-item">
                <i className="ri-phone-line" aria-hidden="true"></i>
                <div>
                  <strong>Phone</strong>
                  <div><a href="tel:+919400230723" onClick={() => trackPhoneClick('+919400230723')}>+91 9400230723</a></div>
                </div>
              </div>
              <div className="contact-item">
                <i className="ri-whatsapp-line" aria-hidden="true"></i>
                <div>
                  <strong>WhatsApp</strong>
                  <div>
                    <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
                      Message us on WhatsApp
                    </a>
                  </div>
                </div>
              </div>
              <div className="contact-item">
                <i className="ri-map-pin-line" aria-hidden="true"></i>
                <div>
                  <strong>Office</strong>
                  <div>Suite V7 66/3520 SPATIUM, Ground Floor Island Castle, Opposite YMCA, Chittoor Road, Ernakulam, Kerala 682035.</div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
