// frontend/src/utils/generatePDF.js

export async function generatePDF({ user, patient, result, imgBase64, imgFormat, gradcamSrc, comment }) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // Dimensions A4: 210mm x 297mm
  const W = 210;
  const MARGIN = 18;
  const CW = W - (MARGIN * 2); // Largeur contenue = 174mm
  let y = 0;

  // Palette de couleurs
  const NAVY = [15, 31, 61];
  const BLUE = [59, 130, 246];
  const LBLUE = [147, 197, 253];
  const GRAY = [75, 106, 155];
  const LIGHT = [226, 234, 248];
  const WHITE = [255, 255, 255];
  
  const diagColor = result.class === 'covid' ? [248, 113, 113] 
    : result.class === 'normal' ? [74, 222, 128] 
    : [251, 191, 36];

  // ============================================
  // HEADER
  // ============================================
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, W, 36, 'F');
  doc.setFillColor(...BLUE);
  doc.rect(0, 34, W, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  doc.setTextColor(...WHITE);
  doc.text('RadioScan AI', MARGIN, 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...LBLUE);
  doc.text('Plateforme de Diagnostic Radiologique — Intelligence Artificielle', MARGIN, 23);

  const now = new Date();
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...WHITE);
  doc.text('RAPPORT MÉDICAL CONFIDENTIEL', W - MARGIN, 12, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...LBLUE);
  doc.text(`${now.toLocaleDateString('fr-FR')} à ${now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`, W - MARGIN, 19, { align: 'right' });
  doc.text(`Réf: RSA-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${Math.floor(Math.random() * 9000 + 1000)}`, W - MARGIN, 26, { align: 'right' });

  y = 40;

  // ============================================
  // SECTION RADIOLOGUE (dimensions ajustées)
  // ============================================
// ── RADIOLOGUE (version avec retour à la ligne) ───────────────────
const radH = 23;  // Hauteur augmentée pour accueillir 2 lignes
doc.setFillColor(...LIGHT);
doc.roundedRect(MARGIN, y, CW, radH, 3, 3, 'F');

// Titre RADIOLOGUE
doc.setFont('helvetica', 'bold');
doc.setFontSize(9);
doc.setTextColor(...GRAY);
doc.text('RADIOLOGUE', MARGIN + 8, y + 7);

// Nom du médecin (première ligne)
doc.setFont('helvetica', 'bold');
doc.setFontSize(11);
doc.setTextColor(...NAVY);
doc.text(user.name, MARGIN + 8, y + 16);

// Rôle (deuxième ligne, à droite du nom)
doc.setFont('helvetica', 'normal');
doc.setFontSize(9);
doc.setTextColor(...GRAY);
// Positionner le rôle à droite du nom avec un espace
const nameWidth = doc.getTextWidth(user.name);
doc.text(user.role, MARGIN + 8 + nameWidth + 10, y + 16);

y += radH + 4;  // +4 d'espace après la section

  // ============================================
  // SECTION PATIENT (dimensions optimisées)
  // ============================================
  if (patient) {
    const boxH = 30;
    doc.setFillColor(15, 31, 61);
    doc.roundedRect(MARGIN, y, CW, boxH, 3, 3, 'F');
    doc.setDrawColor(...BLUE);
    doc.setLineWidth(0.4);
    doc.roundedRect(MARGIN, y, CW, boxH, 3, 3, 'S');

    // Titre PATIENT
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...LBLUE);
    doc.text('PATIENT', MARGIN + 6, y + 7);

    // Nom complet (première ligne)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(...LIGHT);
    doc.text(`${patient.prenom} ${patient.nom}`.toUpperCase(), MARGIN + 6, y + 15);

    // CIN (deuxième ligne)
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...BLUE);
    doc.text(`CIN : ${patient.cin}`, MARGIN + 6, y + 24);

    // Séparateur vertical 1 (après CIN)
    const sep1X = MARGIN + 55;
    doc.setDrawColor(30, 58, 138);
    doc.setLineWidth(0.3);
    doc.line(sep1X, y + 5, sep1X, y + boxH - 5);

    // Colonne 2 : Date naissance + Sexe
    const col2 = sep1X + 6;
    let row2y = y + 10;
    
    if (patient.dateNaissance) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(...LBLUE);
      doc.text('Né(e) le', col2, row2y);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(...LIGHT);
      doc.text(patient.dateNaissance, col2 + 22, row2y);
      row2y += 10;
    }
    
    if (patient.sexe) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(...LBLUE);
      doc.text('Sexe', col2, row2y);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(...LIGHT);
      doc.text(patient.sexe, col2 + 22, row2y);
    }

    // Séparateur vertical 2
    const sep2X = MARGIN + 110;
    doc.line(sep2X, y + 5, sep2X, y + boxH - 5);

    // Colonne 3 : Téléphone + Médecin
    const col3 = sep2X + 6;
    let row3y = y + 10;
    
    if (patient.telephone) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(...LBLUE);
      doc.text('Téléphone', col3, row3y);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(...LIGHT);
      doc.text(patient.telephone, col3 + 22, row3y);
      row3y += 10;
    }
    
    if (patient.medecin) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(...LBLUE);
      doc.text('Médecin', col3, row3y);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(...LIGHT);
      // Tronquer si trop long
      const medecinText = patient.medecin.length > 20 ? patient.medecin.substring(0, 18) + '…' : patient.medecin;
      doc.text(medecinText, col3 + 22, row3y);
    }

    y += boxH + 10;
  }

  // ============================================
  // Helper section title
  // ============================================
  const section = (title) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...BLUE);
    doc.text(title.toUpperCase(), MARGIN, y);
    doc.setDrawColor(...BLUE);
    doc.setLineWidth(0.3);
    doc.line(MARGIN + doc.getTextWidth(title.toUpperCase()) + 4, y - 0.5, MARGIN + CW, y - 0.5);
    y += 8;
  };

  // ============================================
  // SECTION DIAGNOSTIC (dimensions réajustées)
  // ============================================
  // ── DIAGNOSTIC ───────────────────────────────────────────────────
section('Résultat du Diagnostic IA');

// Badge diagnostic
const badgeW = 70;
doc.setFillColor(...diagColor);
doc.roundedRect(MARGIN, y, badgeW, 28, 4, 4, 'F');
doc.setFont('helvetica', 'bold');
doc.setFontSize(9);
doc.setTextColor(...GRAY);
doc.text('DIAGNOSTIC', MARGIN + 6, y + 8);
doc.setFontSize(14);
const diagnosisLabel = result.label || result.prediction;
doc.setTextColor(...WHITE);
doc.text(diagnosisLabel, MARGIN + 6, y + 20);


// Confidence
const confX = MARGIN + badgeW + 8;
const confW = 40;
doc.setFillColor(...LIGHT);
doc.roundedRect(confX, y, confW, 28, 4, 4, 'F');
doc.setFont('helvetica', 'bold');
doc.setFontSize(9);
doc.setTextColor(...GRAY);
doc.text('CONFIANCE', confX + 4, y + 8);
doc.setFontSize(18);
doc.setTextColor(...diagColor);
doc.text(`${result.confidence}%`, confX + 4, y + 21);

// Probabilités
const probX = confX + confW + 8;
const probW = CW - (badgeW + confW + 16);
doc.setFillColor(...LIGHT);
doc.roundedRect(probX, y, probW, 28, 4, 4, 'F');
doc.setFont('helvetica', 'bold');
doc.setFontSize(7);
doc.setTextColor(...GRAY);
doc.text('PROBABILITÉS', probX + 5, y + 7);

// Couleurs pour chaque classe
const classColors = { 
  covid: [248, 113, 113],     // rouge
  normal: [74, 222, 128],     // vert
  pneumonia: [251, 191, 36]   // jaune/orange
};
const classNames = { 
  covid: 'COVID-19', 
  normal: 'Normal', 
  pneumonia: 'Pneumonie' 
};

let probY = y + 11;
const probBarWidth = probW - 10;

Object.entries(result.all_probabilities).forEach(([cls, prob]) => {
  // Récupérer la couleur spécifique de la classe
  const barColor = classColors[cls] || BLUE;
  
  // Calcul de la largeur de la barre (même pour 3.4%)
  const barWidth = Math.max(probBarWidth * prob / 100, 2); // Minimum 2mm pour être visible
  
  // Texte de la probabilité
  doc.setFont('helvetica', cls === result.class ? 'bold' : 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(...NAVY);
  doc.text(`${classNames[cls]}: ${prob.toFixed(1)}%`, probX + 5, probY - 0.5);
  
  // Barre de fond (grise)
  doc.setFillColor(200, 210, 230);
  doc.roundedRect(probX + 5, probY + 1, probBarWidth, 2.5, 1, 1, 'F');
  
  // Barre de progression AVEC LA COULEUR SPÉCIFIQUE DE LA CLASSE
  if (barWidth > 1) {
    doc.setFillColor(...barColor);
    doc.roundedRect(probX + 5, probY + 1, barWidth, 2.5, 1, 1, 'F');
  }
  
  probY += 6;
});

y += 36;

  // ============================================
  // SECTION IMAGERIE (Original + Grad-CAM)
  // ============================================
  section('Imagerie Radiologique — Original & Grad-CAM');

  const imgH = 80;
  const imgW = (CW - 8) / 2;

  // Image originale
  if (imgBase64) {
    try {
      doc.addImage(imgBase64, imgFormat || 'JPEG', MARGIN, y, imgW, imgH, undefined, 'FAST');
    } catch (e) {
      try {
        doc.addImage(imgBase64, imgFormat === 'PNG' ? 'JPEG' : 'PNG', MARGIN, y, imgW, imgH, undefined, 'FAST');
      } catch (err) {
        console.error("Erreur ajout image originale:", err);
      }
    }
  }
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...NAVY);
  doc.text('Radiographie originale', MARGIN, y + imgH + 5);

  // Grad-CAM
  const gradX = MARGIN + imgW + 8;
  if (gradcamSrc) {
    try {
      doc.addImage(gradcamSrc, 'PNG', gradX, y, imgW, imgH, undefined, 'FAST');
    } catch (err) {
      console.error("Erreur ajout Grad-CAM:", err);
    }
  }
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...NAVY);
  doc.text(`Grad-CAM — ${diagnosisLabel}`, gradX, y + imgH + 5);
  
  
  y += imgH + 12;

  // ============================================
  // SECTION COMMENTAIRES
  // ============================================
  section('Observations du Radiologue');

  const commentText = comment && comment.trim() ? comment : '(Aucune observation renseignée)';
  const lines = doc.splitTextToSize(commentText, CW - 12);
  const boxH = Math.max(22, lines.length * 5 + 12);
  
  doc.setFillColor(...LIGHT);
  doc.roundedRect(MARGIN, y, CW, boxH, 3, 3, 'F');
  doc.setFont('helvetica', comment && comment.trim() ? 'normal' : 'italic');
  doc.setFontSize(9);
  doc.setTextColor(...NAVY);
  doc.text(lines, MARGIN + 6, y + 8);

  y += boxH + 10;

  // ============================================
  // SECTION SIGNATURE
  // ============================================
  doc.setDrawColor(180, 200, 230);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, y, MARGIN + CW, y);
  y += 6;
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...NAVY);
  doc.text(user.name, MARGIN, y);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...GRAY);
  doc.text(user.role, MARGIN, y + 5);
  doc.text(`Signé électroniquement — RadioScan AI — ${now.toLocaleDateString('fr-FR')}`, MARGIN, y + 10);

  y += 16;

  // ============================================
  // SECTION DISCLAIMER
  // ============================================
  doc.setFillColor(254, 243, 199);
  doc.roundedRect(MARGIN, y, CW, 18, 3, 3, 'F');
  doc.setDrawColor(251, 191, 36);
  doc.setLineWidth(0.4);
  doc.roundedRect(MARGIN, y, CW, 18, 3, 3, 'S');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(146, 64, 14);
  doc.text('⚠  AVERTISSEMENT MÉDICAL', MARGIN + 4, y + 6);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.3);
  doc.setTextColor(120, 53, 15);
  const disclaimer = "Ce rapport est généré par un système IA à titre d'aide au diagnostic uniquement. Il ne remplace pas l'avis d'un médecin qualifié. Données confidentielles — usage clinique exclusif.";
  doc.text(doc.splitTextToSize(disclaimer, CW - 8), MARGIN + 4, y + 11);

  // ============================================
  // FOOTER (toutes les pages)
  // ============================================
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFillColor(...NAVY);
    doc.rect(0, 285, W, 12, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(...GRAY);
    doc.text('RadioScan AI — Diagnostic Radiologique — Confidentiel', MARGIN, 292);
    doc.text(`Page ${i} / ${pages}`, W - MARGIN, 292, { align: 'right' });
  }

  // Sauvegarde du fichier
  const fname = `RadioScan_${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${user.username || 'rapport'}.pdf`;
  doc.save(fname);
}