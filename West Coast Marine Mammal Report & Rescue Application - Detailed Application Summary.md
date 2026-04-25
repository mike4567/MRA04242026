# **West Coast Marine Mammal Report & Rescue Application \- Detailed Application Summary**

The West Coast Marine Mammal Report & Rescue application is a full-stack web application designed to streamline the reporting and response process for marine animal entanglements and strandings along the US West Coast.

### **Marine Incident Response Project Summary**

This modernized workflow transitions the incident reporting paradigm from a linear, voice-based telephone relay to a dynamic digital platform. By augmenting the live-attendant hotline with an AI-enhanced web submission, the WCR eliminates phone barriers and the "information bottleneck" of verbal descriptions. The new system enables the direct capture of critical event attributes and rich media (photos/video) which were previously lost in translation.

To ensure rapid and effective mobilization, an integrated AI agent performs a preliminary analysis of the submitted data, providing responders with immediate, actionable intelligence. This process significantly reduces response latency and improves situational awareness while ensuring accessibility for a diverse public.

### **Incident Response Personnel Responsibilities**

* **Reporting Party (Public):** Direct submission of location, animal condition, and digital media evidence (photos/video).  
* **AI Agent:** Immediate data triage, synthesis of incident attributes, and generation of a preliminary analysis summary.  
* **Responder:** Review of AI-generated analysis, verification of media assets, and execution of field response.  
* **Response Administrator:** Management of the dashboard interface and configuration of responder routing logic (geo-fencing).

### **1\. Core Purpose**

The application serves as a bridge between the public and NOAA Fisheries. It allows citizens to report distressed marine animals (whales, dolphins, seals, sea turtles) and uses AI and geolocation logic to instantly notify the correct authorized response team.

### **2\. User Workflows**

#### **A. Public Reporting (The Reporter)**

* **Access Points:** Webpage will be accessed by URL and/or QR Code displayed at marine locations (public beaches, ports, docks, etc.).  
* **Multi-lingual Accessibility (Planned):** Currently dependent on external browser tools, future updates will implement Next.js native internationalization to automatically detect and render the interface in the user's preferred device language.  
* **Incident Form:** A user-friendly, single-page wizard for submitting reports.  
* **Geolocation:** Users can pinpoint the incident using an interactive Google Map, current geolocation, or manual address entry (Geocoding).  
* **Animal Details:** Collects specific data including species (Cetacean vs. Pinniped), life status (Alive vs. Dead), and condition (Entangled, Stranded, Injured).  
* **Media Upload:** Users upload photos or videos which are stored in **Google Cloud Storage**.  
* **AI Triage:** Upon submission, the app uses **Genkit** (Gemini 2.0 Flash/Pro or equivalent) to analyze the uploaded media and description to generate a concise summary of the event for the responder.

  #### **B. Responder & Triage System**

* **Dynamic Responder Assignment:** The app queries an external **ArcGIS API** (Marine Mammal Stranding Network layer) using the incident's coordinates. It applies complex logic to determine the correct responding agency based on:  
  * **Location:** (Latitude/Longitude)  
  * **Status:** (Live vs. Dead)  
  * **Type:** (Pinniped vs. Cetacean)  
* **SMS Alerts:** Uses **Twilio** to send an immediate text message to the assigned responder. The SMS includes the AI-generated summary and a link to a secure or public detail page.

  #### **C. Administrative Dashboard (NOAA/Responders)**

* **Authentication:** Secured via **Google Authentication** (Google Identity Platform). NOAA ICAM Configuration is pending  
* **Incident Management:** A secure dashboard to view a real-time list of incidents.  
* **Status Workflow:** Admins can update incident statuses (Reported $\\rightarrow$ Under Review $\\rightarrow$ Response Underway $\\rightarrow$ Resolved).  
* **Private vs. Public Data:** The app maintains two database collections (incidents for sensitive data like reporter phone numbers, and public\_incidents for sanitized read-only views) to ensure privacy of reporters and transparency of events.

  #### **D. Public Dashboard**

* **Public Access:** Provides an open-access interface where community members can browse a historical and real-time log of reported marine incidents. This feature acts as a digital ledger, allowing users to track local stranding trends and verify that their submissions have been successfully registered within the Responder network.  
* **Transparency:** Enhances agency accountability by visualizing the lifecycle of a report. The dashboard displays key status updates—such as "Response Underway" or "Resolved"—along with sanitized responder notes. This closes the communication loop, keeping the public informed about the outcomes of their reports while strictly filtering out sensitive operational data or private reporter details.

### **3\. Technical Architecture & Compliance**

The application was designed specifically to meet **FedRAMP** (Federal Risk and Authorization Management Program) compliance standards by utilizing enterprise-grade Google Cloud services.

* **Compute:** The Next.js application is containerized using Docker and deployed on **Google Cloud Run** (a managed, FedRAMP-authorized compute platform).  
* **Database:** **Cloud SQL** (PostgreSQL) handling real-time data synchronization.  
* **Storage:** **Google GCP Buckets** are used to store media submitted by the reporter and responder.  
* **Scalability:** The architecture leverages **Google Cloud Run's** serverless auto-scaling capabilities to automatically adjust compute resources based on incoming traffic, ensuring high availability during peak reporting times (e.g., mass stranding events). Additionally, **Cloud SQL** provides robust vertical scaling options to handle growing datasets without compromising performance.  
* **Infrastructure as Code (IaC):** The entire environment (IAM roles, Cloud Run services, Secrets, Artifact Registry) is provisioned and managed using **Terraform**.  
* **Security:**  
  * **Secret Manager:** API keys (Twilio, Google Maps) are injected at runtime via Google Secret Manager, never hardcoded.  
  * **Least Privilege IAM:** Custom Service Accounts are used for Cloud Run with restricted permissions.  
* **Frontend Framework:** Built with **Next.js 15**, utilizing **Tailwind CSS** and **Shadcn UI** for the component library.

### **4\. Key Integrations**

* **Google AI (Genkit):** For image analysis and incident summarization.  
* **Google Maps Platform:** For geocoding and interactive mapping.  
* **Twilio:** For SMS dispatch notifications.  
* **ArcGIS (Esri):** For spatial queries to identify stranding network jurisdictions.

