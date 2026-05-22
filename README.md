<!-- ╔══════════════════════════════════════════════════════════════════╗ -->
<!-- ║                          HEADER BANNER                            ║ -->
<!-- ╚══════════════════════════════════════════════════════════════════╝ -->

<div align="center">

![Header](https://capsule-render.vercel.app/api?type=waving&color=0:0F2027,40:1BA0D7,100:0F2027&height=220&section=header&text=Rango&fontSize=78&fontColor=ffffff&fontAlignY=36&desc=Network%20Security%20%E2%80%A2%20Observability%20%E2%80%A2%20DevSecOps&descAlignY=58&descSize=18&animation=fadeIn)

<a href="https://github.com/RangoGM">
  <img src="https://readme-typing-svg.demolab.com?font=Fira+Code&size=22&duration=3200&pause=700&color=1BA0D7&center=true&vCenter=true&width=760&lines=Securing+Layer+2%2C+one+ASIC+at+a+time;Building+AI-driven+network+defense+systems;From+Cisco+CLI+%E2%86%92+Cloud-native+observability;CCNA+%E2%9C%93+%E2%80%A2+AWS+SAA+%E2%9F%B3+%E2%80%A2+LPIC-1+%E2%9F%B3" alt="Typing SVG" />
</a>

<br/>

<img src="https://komarev.com/ghpvc/?username=RangoGM&label=Profile%20views&color=1BA0D7&style=flat-square" alt="profile views" />
<img src="https://img.shields.io/github/followers/RangoGM?label=Followers&style=flat-square&color=1BA0D7" alt="followers" />
<img src="https://img.shields.io/badge/Based%20in-Ho%20Chi%20Minh%20City%20%F0%9F%87%BB%F0%9F%87%B3-1BA0D7?style=flat-square" alt="location" />
<img src="https://img.shields.io/badge/Open%20to-Research%20%26%20Collab-success?style=flat-square" alt="open" />

</div>

<br/>

<!-- ╔══════════════════════════════════════════════════════════════════╗ -->
<!-- ║                       CCNA ACHIEVEMENT                            ║ -->
<!-- ╚══════════════════════════════════════════════════════════════════╝ -->

<div align="center">

# 🏆 Cisco Certified Network Associate (CCNA 200-301)

### 📅 Achieved · March 19, 2026

</div>

---

<!-- ╔══════════════════════════════════════════════════════════════════╗ -->
<!-- ║                            ABOUT ME                               ║ -->
<!-- ╚══════════════════════════════════════════════════════════════════╝ -->

## 🚀 About Me

I'm a networking and security enthusiast based in **Ho Chi Minh City**, focused on securing infrastructure and understanding real-world protocol behavior. I continuously build lab environments to **simulate attacks, validate configurations, and strengthen defensive network design**.

> 🛡️ **Research Project (NCKH)**  
> *Layered Security Model for Enterprise Access Networks* — an 8-layer Defense-in-Depth architecture validated on physical Cisco Catalyst 2960, with systematic vulnerability exploitation across each layer.

> 🧠 **Documentation**  
> Every lab and research finding is documented in my **[Second Brain](https://github.com/RangoGM/ccna-labs)** repository.

---

<!-- ╔══════════════════════════════════════════════════════════════════╗ -->
<!-- ║                          NOW BUILDING                             ║ -->
<!-- ╚══════════════════════════════════════════════════════════════════╝ -->

## 🔬 Now Building

<div align="center">

<table border="0">
  <tr>
    <td align="center" width="50%">
      <b>Devices Observability (Switch/Router)</b><br/><br/>
      <img src="https://github.com/RangoGM/RangoGM/blob/main/assets/grafana-telemetry-demo.gif?raw=true" width="100%" alt="Grafana telemetry dashboard demo" />
    </td>
    <td align="center" width="50%">
      <b>Server Observability</b><br/><br/>
      <img src="https://github.com/RangoGM/RangoGM/blob/main/assets/grafana-telemetry-demo-02.gif?raw=true" width="100%" alt="Layer 2 observability dashboard demo" />
    </td>
  </tr>
  <tr>
    <td align="center" width="50%">
      <b>MIMIR Control Plane</b><br/><br/>
      <img src="https://github.com/RangoGM/RangoGM/blob/main/assets/mimir-admin-demo.gif?raw=true" width="100%" alt="MIMIR network administration demo" />
    </td>
    <td align="center" width="50%">
      <b>ARGUS Security Auditor</b><br/><br/>
      <sub><i>Updated later.</i></sub>
    </td>
  </tr>
</table>

</div>

---

<!-- ╔══════════════════════════════════════════════════════════════════╗ -->
<!-- ║                         LAB TOPOLOGY                              ║ -->
<!-- ╚══════════════════════════════════════════════════════════════════╝ -->

## 🗺️ Lab Topology

```mermaid
flowchart LR
    K["🔴 Kali Linux<br/>Attacker"] -->|L2 attacks| SW
    W["🪟 Windows<br/>Victim"] -->|client traffic| SW
    SW["🔷 Cisco Catalyst 2960<br/>(physical L2 switch)"] -->|inter-VLAN| R["🌐 Cisco 2811<br/>Router"]
    SW -->|services + telemetry| UB["🐧 Ubuntu Server<br/>FreeRADIUS · rsyslog<br/>Grafana · Loki · Prometheus · Ollama"]

    UB -. syslog .-> LK["📜 Loki"]
    UB -. SNMP .-> PR["📈 Prometheus"]
    UB -. AI .-> OL["🦙 Ollama / Llama 3"]
    LK & PR --> GF["📊 Grafana Dashboards"]

    classDef attacker fill:#3a1212,stroke:#ff4d4d,color:#fff;
    classDef victim fill:#1a2a4a,stroke:#7aa2f7,color:#fff;
    classDef net fill:#0f3a4a,stroke:#1BA0D7,color:#fff;
    classDef obs fill:#2a1a3a,stroke:#bb86fc,color:#fff;
    class K attacker;
    class W victim;
    class SW,R net;
    class UB,LK,PR,OL,GF obs;
```

---

<!-- ╔══════════════════════════════════════════════════════════════════╗ -->
<!-- ║                     RESEARCH & PUBLICATIONS                       ║ -->
<!-- ╚══════════════════════════════════════════════════════════════════╝ -->

## 📚 Research & Publications

<sub><i>Updated later.</i></sub>

---

<!-- ╔══════════════════════════════════════════════════════════════════╗ -->
<!-- ║                           TECH STACK                              ║ -->
<!-- ╚══════════════════════════════════════════════════════════════════╝ -->

## 🛠️ Tech Stack & Tools

<div align="center">

<p>
  <kbd><img src="https://cdn.simpleicons.org/cisco/1BA0D7" width="40" height="40" alt="Cisco" title="Cisco IOS" /></kbd>
  <kbd><img src="https://cdn.simpleicons.org/wireshark/1679A7" width="40" height="40" alt="Wireshark" title="Wireshark" /></kbd>
  <kbd><img src="https://skillicons.dev/icons?i=kali" width="40" height="40" alt="Kali Linux" title="Kali Linux" /></kbd>
  <kbd><img src="https://cdn.simpleicons.org/openvpn/EA7E20" width="40" height="40" alt="OpenVPN" title="OpenVPN" /></kbd>
  <kbd><img src="https://cdn.simpleicons.org/grafana/F46800" width="40" height="40" alt="Grafana" title="Grafana" /></kbd>
  <kbd><img src="https://cdn.simpleicons.org/prometheus/E6522C" width="40" height="40" alt="Prometheus" title="Prometheus" /></kbd>
</p>

<p>
  <kbd><img src="https://skillicons.dev/icons?i=python" width="40" height="40" alt="Python" title="Python" /></kbd>
  <kbd><img src="https://skillicons.dev/icons?i=bash" width="40" height="40" alt="Bash" title="Bash" /></kbd>
  <kbd><img src="https://skillicons.dev/icons?i=ansible" width="40" height="40" alt="Ansible" title="Ansible" /></kbd>
  <kbd><img src="https://skillicons.dev/icons?i=terraform" width="40" height="40" alt="Terraform" title="Terraform" /></kbd>
  <kbd><img src="https://skillicons.dev/icons?i=docker" width="40" height="40" alt="Docker" title="Docker" /></kbd>
  <kbd><img src="https://skillicons.dev/icons?i=aws" width="40" height="40" alt="AWS" title="AWS" /></kbd>
</p>

<p>
  <kbd><img src="https://skillicons.dev/icons?i=linux" width="40" height="40" alt="Linux" title="Linux" /></kbd>
  <kbd><img src="https://skillicons.dev/icons?i=ubuntu" width="40" height="40" alt="Ubuntu" title="Ubuntu" /></kbd>
  <kbd><img src="https://skillicons.dev/icons?i=windows" width="40" height="40" alt="Windows" title="Windows" /></kbd>
  <kbd><img src="https://cdn.simpleicons.org/vmware/607078" width="40" height="40" alt="VMware" title="VMware" /></kbd>
  <kbd><img src="https://cdn.simpleicons.org/ollama/000000" width="40" height="40" alt="Ollama" title="Ollama" /></kbd>
  <kbd><img src="https://skillicons.dev/icons?i=git" width="40" height="40" alt="Git" title="Git" /></kbd>
</p>

<p>
  <kbd><img src="https://skillicons.dev/icons?i=github" width="40" height="40" alt="GitHub" title="GitHub" /></kbd>
  <kbd><img src="https://skillicons.dev/icons?i=vscode" width="40" height="40" alt="VS Code" title="VS Code" /></kbd>
</p>

</div>

---

<!-- ╔══════════════════════════════════════════════════════════════════╗ -->
<!-- ║                         AI MAIN TOOLS                             ║ -->
<!-- ╚══════════════════════════════════════════════════════════════════╝ -->

## 🧠 AI Main Tools

<div align="center">

<p>
  <kbd><img src="https://cdn.simpleicons.org/claude/D97757" width="40" height="40" alt="Claude" title="Claude" /></kbd>
  <kbd><img src="https://cdn.simpleicons.org/googlegemini/8E75B2" width="40" height="40" alt="Gemini" title="Gemini" /></kbd>
</p>

<p>
  <img src="https://img.shields.io/badge/Codex-412991?style=for-the-badge&logo=openai&logoColor=white" alt="Codex" />
  <img src="https://img.shields.io/badge/ChatGPT-10A37F?style=for-the-badge&logo=openai&logoColor=white" alt="ChatGPT" />
</p>

</div>

---

<!-- ╔══════════════════════════════════════════════════════════════════╗ -->
<!-- ║                         CERTIFICATIONS                            ║ -->
<!-- ╚══════════════════════════════════════════════════════════════════╝ -->

<div align="center">

## 📜 Certifications

<table border="0">
  <tr>
    <td align="center" colspan="2" valign="top">
      <a href="https://www.credly.com/badges/cf634bce-0207-4719-bbc9-3a3de93f6471/public_url">
        <img src="https://images.credly.com/images/683783d8-eaac-4c37-a14d-11bd8a36321d/ccna_600.png" width="120" alt="CCNA" /><br/>
        <b>CCNA — Cisco Certified Network Associate</b>
      </a>
    </td>
  </tr>
  <tr>
    <td align="center" width="50%" valign="top">
      <a href="https://www.credly.com/badges/137b8b59-e112-4f64-818f-68e3a5197eb7/public_url">
        <img src="https://images.credly.com/images/5bdd6a39-3e03-4444-9510-ecff80c9ce79/image.png" width="90" alt="Networking Basics" /><br/>
        <b>Networking Basics</b>
      </a>
    </td>
    <td align="center" width="50%" valign="top">
      <a href="https://www.credly.com/badges/8cfb68bb-aace-4849-918a-74b4ed1e3052/public_url">
        <img src="https://images.credly.com/size/340x340/images/88316fe8-5651-4e61-a6be-5be1558f049e/image.png" width="90" alt="Networking Devices Initial Configuration" /><br/>
        <b>Networking Devices<br/>Initial Configuration</b>
      </a>
    </td>
  </tr>
  <tr>
    <td align="center" width="50%" valign="top">
      <a href="https://www.credly.com/badges/ebf156c7-193f-4758-8c67-5c89f9d92c70/public_url">
        <img src="https://images.credly.com/size/340x340/images/49c099bd-8542-4f48-8c03-f21799dcaf51/image.png" width="90" alt="Network Addressing Troubleshooting" /><br/>
        <b>Network Addressing<br/>Troubleshooting</b>
      </a>
    </td>
    <td align="center" width="50%" valign="top">
      <a href="https://www.credly.com/badges/05a881bd-d6f9-4242-a03f-47245d3cf7f1/public_url">
        <img src="https://images.credly.com/size/340x340/images/a4dd891f-7bf5-4938-8241-50dc81e8cc00/image.png" width="90" alt="Network Support and Security" /><br/>
        <b>Network Support<br/>&amp; Security</b>
      </a>
    </td>
  </tr>
</table>

</div>

---

<!-- ╔══════════════════════════════════════════════════════════════════╗ -->
<!-- ║                     CERTIFICATION ROADMAP                         ║ -->
<!-- ╚══════════════════════════════════════════════════════════════════╝ -->

## 🎯 Certification Roadmap

```mermaid
flowchart LR
    A["✅ CCNA<br/><b>Earned</b>"]:::done
    B["📚 AWS SAA"]:::planned
    C["📚 Security+"]:::planned
    D["📚 LPIC-1"]:::planned
    E["📚 CKA"]:::planned
    F["⭐ CKS<br/><b>North Star</b>"]:::star

    A --> B --> C --> D --> E --> F

    classDef done    fill:#0d3320,stroke:#28a745,color:#ffffff,stroke-width:2px
    classDef planned fill:#0f2a4a,stroke:#1BA0D7,color:#ffffff,stroke-width:2px
    classDef star    fill:#3a1f5c,stroke:#bb86fc,color:#ffffff,stroke-width:3px
```

<div align="center">

<table>
  <tr>
    <td>🟢 <b>Earned</b></td>
    <td>CCNA — Cisco networking foundation</td>
  </tr>
  <tr>
    <td>📚 <b>Planned</b></td>
    <td>Cloud · Security baseline · Linux · Kubernetes admin</td>
  </tr>
  <tr>
    <td>⭐ <b>North Star</b></td>
    <td>CKS — capstone for the DevSecOps path</td>
  </tr>
</table>

<sub><i>Sequence reflects intended order, not committed dates.</i></sub>

</div>

---

<!-- ╔══════════════════════════════════════════════════════════════════╗ -->
<!-- ║                         GITHUB STATS                              ║ -->
<!-- ╚══════════════════════════════════════════════════════════════════╝ -->

## 📊 GitHub Activity

<div align="center">

<table border="0">
  <tr>
    <td colspan="2" align="center">
      <img src="https://github-profile-summary-cards.vercel.app/api/cards/profile-details?username=RangoGM&theme=github_dark" width="100%" alt="GitHub Profile Summary" />
    </td>
  </tr>
  <tr>
    <td align="center" width="50%">
      <img src="https://github-profile-summary-cards.vercel.app/api/cards/repos-per-language?username=RangoGM&theme=github_dark" width="100%" alt="Repos per Language" />
    </td>
    <td align="center" width="50%">
      <img src="https://github-profile-summary-cards.vercel.app/api/cards/most-commit-language?username=RangoGM&theme=github_dark" width="100%" alt="Most Commit Language" />
    </td>
  </tr>
  <tr>
    <td align="center" width="50%">
      <img src="https://github-profile-summary-cards.vercel.app/api/cards/stats?username=RangoGM&theme=github_dark" width="100%" alt="GitHub Stats" />
    </td>
    <td align="center" width="50%">
      <img src="https://github-profile-summary-cards.vercel.app/api/cards/productive-time?username=RangoGM&theme=github_dark&utcOffset=7" width="100%" alt="Productive Time" />
    </td>
  </tr>
  <tr>
    <td colspan="2" align="center">
      <img src="https://github-readme-activity-graph.vercel.app/graph?username=RangoGM&theme=tokyo-night&bg_color=0D1117&color=1BA0D7&line=1BA0D7&point=ffffff&hide_border=true&area=true" width="100%" alt="Activity Graph" />
    </td>
  </tr>
</table>

</div>

---

<!-- ╔══════════════════════════════════════════════════════════════════╗ -->
<!-- ║                            CONNECT                                ║ -->
<!-- ╚══════════════════════════════════════════════════════════════════╝ -->

## 📍 Current Base & Connect

<div align="center">

![Location](https://img.shields.io/badge/Location-Ho_Chi_Minh_City,_Vietnam-EA4335?style=for-the-badge&logo=google-maps&logoColor=white)
[![Facebook](https://img.shields.io/badge/Facebook-1877F2?style=for-the-badge&logo=facebook&logoColor=white)](https://)
[![Discord](https://img.shields.io/badge/Discord-5865F2?style=for-the-badge&logo=discord&logoColor=white)](https://discordapp.com/users/698729316703404154)
[![Gmail](https://img.shields.io/badge/Gmail-D14836?style=for-the-badge&logo=gmail&logoColor=white)](mailto:)
[![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/RangoGM)

<br/>

<sub>
  <i>"Build labs. Break things. Document everything."</i>
</sub>

</div>

<br/>

<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:0F2027,40:1BA0D7,100:0F2027&height=100&section=footer&animation=fadeIn" width="100%" alt="Footer" />

</div>
