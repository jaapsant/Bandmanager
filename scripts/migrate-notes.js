/**
 * Migration Script: Add member notes to gigs
 *
 * HOW TO USE:
 * 1. Open your Bandmanager app in the browser
 * 2. Log in as admin
 * 3. Open the browser Developer Tools (F12 or Ctrl+Shift+I)
 * 4. Go to the "Console" tab
 * 5. Copy and paste this entire script
 * 6. Press Enter to run it
 * 7. First run: migrationDryRun() - to see what will be changed
 * 8. After verification: executeMigration() - to apply the changes
 */

// ============================================
// NOTES DATA FROM OLD SYSTEM
// ============================================
const notesData = {
  "Joske": {
    "Carnaval bemmel": "Oppas moet nog wel geregeld worden",
    "Groenlo": "Ovv oppas",
    "Soundbrass": "Ovv oppas maar gaan we proberen te regelen",
    "Vierdaagse": "Waarsch vakantie",
    "Buitenlandreis": "Intentie is er zeker!"
  },
  "Greet": {
    "Carnaval Tilburg": "Afhankelijk van mogelijke optredens Phillies",
    "Carnaval Eindhoven": "Na de optocht in Helmond kan ik aansluiten, verwacht dat dit rond 17:30/18:00 uur gaat zijn, maar is afhankelijk van startnummer.",
    "Repetitiedag": "Misschien weekend weg met zeilvereniging",
    "Wielerspektakel": "Misschien op vakantie",
    "Deutsche Mittag": "Afhankelijk van vakantieplannen"
  },
  "Tijme": {
    "Carnaval Tilburg": "Of Tilburg of Eindhoven afhankelijk van bezetting",
    "Carnaval Eindhoven": "Of Tilburg of Eindhoven afhankelijk van bezetting",
    "Repetitiedag": "Tenzij ik oppas kan regelen",
    "90e verjaardag": "Tenzij ik oppas kan regelen",
    "Soundbrass": "Tenzij ik oppas kan regelen",
    "Wielerspektakel": "Vakantie",
    "Buitenlandreis": "Valt in mijn vakantie. Voor nu nee, misschien later alsnog.",
    "Deutsche Mittag": "Afhankelijk van rooster. Weet ik in april."
  },
  "Rony": {
    "Carnaval Tilburg": "Waarschijnlijk alleen overdag",
    "Vierdaagse": "Ovb van vakantieplannen, als het even kan ben ik er bij!"
  },
  "Oppie": {
    "Carnaval Eindhoven": "Afhankelijk van oppas",
    "90e verjaardag": "Misschien op vakantie",
    "Wielerspektakel": "Eens met Erik, en eigenlijk ook liever een leuker optreden begin september zoals in 2025. (Of Halle)",
    "Deutsche Mittag": "Gzt weekend en buitenland weekend zitten ook in deze periode. Wel lekker dichtbij huis."
  },
  "Joren": {
    "Carnaval Eindhoven": "Joske of ik",
    "Stroatparade Dongen": "1 van ons 2",
    "Groenlo": "Onder voorbehoud van oppas (voor Joske of ik)",
    "Deutsche Mittag": "Niet icm buitenlandreis"
  },
  "Derk": {
    "Carnaval Eindhoven": "Mogelijk ben ik iets later.",
    "Stroatparade Dongen": "Misschien op vakantie"
  },
  "Heike": {
    "Stroatparade Dongen": "Werkweekend. Weet niet zeker of ik kan ruilen daarom op nee.",
    "Wielerspektakel": "Zeer waarschijnlijk vakantie",
    "Buitenlandreis": "Ik vind het lastig om toe te zeggen. Dit is altijd onze vakantieperiode. Als dit de datum wordt, kan ik mijn best doen om de vakantie er omheen te plannen."
  },
  "Marte": {
    "Repetitiedag": "Waarschijnlijk vanaf 13:00 uur",
    "90e verjaardag": "Laat ik zsm weten",
    "Wielerspektakel": "Misschien vakantie"
  },
  "Joris": {
    "Repetitiedag": "Vanaf 1 waarschijnlijk",
    "Soundbrass": "Wss niet",
    "Dweildag": "Vanaf 13:00 ivm generale jubileum concert ab",
    "Wielerspektakel": "Onbekend mogelijk op vakantie dan",
    "Buitenlandreis": "Vanaf zaterdag beschikbaar"
  },
  "Anne": {
    "90e verjaardag": "Mogelijk vakantie",
    "Groenlo": "Mogelijk vakantie"
  },
  "Marielle": {
    "Groenlo": "Misschien. Weet het vlak van te voren dus zal als bonus zijn."
  },
  "Desi": {
    "Soundbrass": "Koen zou ook graag mee willen",
    "Buitenlandreis": "Ik sla de buitenlandreis sowieso over."
  },
  "Jasper": {
    "Soundbrass": "Lekker dan.. kiezen tussen volleybaldames en dit? Volleybaltoernooi bedoel ik...",
    "Vierdaagse": "Wel ovb van vakantie planning"
  },
  "Tim": {
    "Soundbrass": "Waarschijnlijk een 'ja' Weet ik voor 26 januari"
  },
  "Bart": {
    "Vierdaagse": "Als ik mee ga lopen alleen in het begin"
  },
  "Rick": {
    "Wielerspektakel": "bloemencorso Lichtenvoorde, anders mogelijk op vakantie"
  },
  "Erik": {
    "Wielerspektakel": "Wel veel Bemmel in een korte tijd. Dan zou ik avondvierdaagse of dit doen.",
    "Deutsche Mittag": "Niet enthousiast. Ons opdraaftarrief blijft zuinig, overigens."
  },
  "Marije": {
    "Deutsche Mittag": "Zie Joren. Anders wel."
  }
};

// ============================================
// HELPER FUNCTIONS
// ============================================

// Normalize string for comparison (lowercase, trim, remove extra spaces)
function normalize(str) {
  return str.toLowerCase().trim().replace(/\s+/g, ' ');
}

// Find best match for a name in a list of items
function findMatch(searchName, items, nameField) {
  const normalizedSearch = normalize(searchName);

  // First try exact match
  let match = items.find(item => normalize(item[nameField]) === normalizedSearch);
  if (match) return { match, confidence: 'exact' };

  // Try contains match
  match = items.find(item =>
    normalize(item[nameField]).includes(normalizedSearch) ||
    normalizedSearch.includes(normalize(item[nameField]))
  );
  if (match) return { match, confidence: 'partial' };

  // Try word-by-word match for gigs (e.g., "Carnaval" matches "Carnaval Bemmel")
  const searchWords = normalizedSearch.split(' ');
  match = items.find(item => {
    const itemWords = normalize(item[nameField]).split(' ');
    return searchWords.some(word => itemWords.some(itemWord =>
      itemWord.includes(word) || word.includes(itemWord)
    ));
  });
  if (match) return { match, confidence: 'fuzzy' };

  return { match: null, confidence: 'none' };
}

// ============================================
// MAIN FUNCTIONS
// ============================================

async function fetchData() {
  console.log('Fetching data from Firebase...');

  // Get the Firestore instance exposed by the app
  const db = window.__FIREBASE_DB__;
  if (!db) {
    throw new Error(
      'Firebase db not found. Make sure you:\n' +
      '1. Are on the Bandmanager app page\n' +
      '2. Have reloaded the page after the latest code update\n' +
      '3. Are logged in'
    );
  }

  // Import Firestore functions from the same CDN version
  const { collection, getDocs } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');

  // Fetch band members
  const membersSnapshot = await getDocs(collection(db, 'bandMembers'));
  const bandMembers = [];
  membersSnapshot.forEach(doc => {
    bandMembers.push({ id: doc.id, ...doc.data() });
  });

  // Fetch gigs
  const gigsSnapshot = await getDocs(collection(db, 'gigs'));
  const gigs = [];
  gigsSnapshot.forEach(doc => {
    gigs.push({ id: doc.id, ...doc.data() });
  });

  console.log(`Found ${bandMembers.length} band members and ${gigs.length} gigs`);

  return { bandMembers, gigs, db };
}

async function migrationDryRun() {
  console.log('='.repeat(60));
  console.log('MIGRATION DRY RUN - No changes will be made');
  console.log('='.repeat(60));

  try {
    const { bandMembers, gigs } = await fetchData();

    console.log('\n--- BAND MEMBERS IN DATABASE ---');
    bandMembers.forEach(m => console.log(`  - ${m.name} (ID: ${m.id})`));

    console.log('\n--- GIGS IN DATABASE ---');
    gigs.forEach(g => console.log(`  - ${g.name} (ID: ${g.id}, Date: ${g.date})`));

    console.log('\n--- MATCHING RESULTS ---\n');

    const updates = [];
    const unmatchedMembers = [];
    const unmatchedGigs = [];

    for (const [memberName, memberGigs] of Object.entries(notesData)) {
      const memberMatch = findMatch(memberName, bandMembers, 'name');

      if (!memberMatch.match) {
        unmatchedMembers.push(memberName);
        console.log(`[MEMBER NOT FOUND] ${memberName}`);
        continue;
      }

      const member = memberMatch.match;
      console.log(`[MEMBER] ${memberName} -> ${member.name} (${memberMatch.confidence})`);

      for (const [gigName, note] of Object.entries(memberGigs)) {
        const gigMatch = findMatch(gigName, gigs, 'name');

        if (!gigMatch.match) {
          unmatchedGigs.push({ memberName, gigName });
          console.log(`  [GIG NOT FOUND] ${gigName}`);
          continue;
        }

        const gig = gigMatch.match;
        const existingNote = gig.memberAvailability?.[member.id]?.note;

        updates.push({
          memberId: member.id,
          memberName: member.name,
          gigId: gig.id,
          gigName: gig.name,
          note: note,
          existingNote: existingNote,
          matchConfidence: gigMatch.confidence
        });

        const notePreview = note.length > 50 ? note.substring(0, 50) + '...' : note;
        const existingPreview = existingNote ? ` [EXISTING: "${existingNote}"]` : '';
        console.log(`  [GIG] ${gigName} -> ${gig.name} (${gigMatch.confidence})`);
        console.log(`        Note: "${notePreview}"${existingPreview}`);
      }
      console.log('');
    }

    console.log('='.repeat(60));
    console.log('SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total updates to apply: ${updates.length}`);
    console.log(`Unmatched members: ${unmatchedMembers.length}`);
    if (unmatchedMembers.length > 0) {
      console.log(`  - ${unmatchedMembers.join(', ')}`);
    }
    console.log(`Unmatched gigs: ${unmatchedGigs.length}`);
    if (unmatchedGigs.length > 0) {
      unmatchedGigs.forEach(u => console.log(`  - ${u.memberName}: ${u.gigName}`));
    }

    const hasExistingNotes = updates.filter(u => u.existingNote).length;
    if (hasExistingNotes > 0) {
      console.log(`\n[WARNING] ${hasExistingNotes} gigs already have notes that will be overwritten!`);
    }

    console.log('\nTo apply these changes, run: executeMigration()');

    // Store updates for later execution
    window.__MIGRATION_UPDATES__ = updates;
    window.__MIGRATION_DATA__ = { bandMembers, gigs };

    return updates;
  } catch (error) {
    console.error('Error during dry run:', error);
    throw error;
  }
}

async function executeMigration() {
  const updates = window.__MIGRATION_UPDATES__;

  if (!updates || updates.length === 0) {
    console.log('No updates to apply. Run migrationDryRun() first.');
    return;
  }

  console.log('='.repeat(60));
  console.log('EXECUTING MIGRATION');
  console.log('='.repeat(60));

  const confirmResult = prompt(`You are about to update ${updates.length} notes. Type "YES" to confirm:`);
  if (confirmResult !== 'YES') {
    console.log('Migration cancelled.');
    return;
  }

  try {
    const { doc, updateDoc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');

    const db = window.__FIREBASE_DB__;
    if (!db) {
      throw new Error('Firebase db not found. Reload the page and try again.');
    }

    let successCount = 0;
    let errorCount = 0;

    // Group updates by gig to minimize database writes
    const updatesByGig = {};
    for (const update of updates) {
      if (!updatesByGig[update.gigId]) {
        updatesByGig[update.gigId] = {
          gigId: update.gigId,
          gigName: update.gigName,
          memberUpdates: []
        };
      }
      updatesByGig[update.gigId].memberUpdates.push({
        memberId: update.memberId,
        memberName: update.memberName,
        note: update.note
      });
    }

    for (const [gigId, gigUpdates] of Object.entries(updatesByGig)) {
      try {
        // Fetch current gig data
        const gigRef = doc(db, 'gigs', gigId);
        const gigSnap = await getDoc(gigRef);

        if (!gigSnap.exists()) {
          console.error(`Gig not found: ${gigId}`);
          errorCount += gigUpdates.memberUpdates.length;
          continue;
        }

        const gigData = gigSnap.data();
        const memberAvailability = { ...gigData.memberAvailability };

        // Update notes for each member
        for (const memberUpdate of gigUpdates.memberUpdates) {
          if (!memberAvailability[memberUpdate.memberId]) {
            memberAvailability[memberUpdate.memberId] = {
              status: 'maybe',
              dateAvailability: {}
            };
          }
          memberAvailability[memberUpdate.memberId].note = memberUpdate.note;
          console.log(`  Updated: ${memberUpdate.memberName} -> ${gigUpdates.gigName}`);
          successCount++;
        }

        // Save updated gig
        await updateDoc(gigRef, { memberAvailability });
        console.log(`Saved gig: ${gigUpdates.gigName}`);

      } catch (error) {
        console.error(`Error updating gig ${gigUpdates.gigName}:`, error);
        errorCount += gigUpdates.memberUpdates.length;
      }
    }

    console.log('='.repeat(60));
    console.log('MIGRATION COMPLETE');
    console.log('='.repeat(60));
    console.log(`Successful updates: ${successCount}`);
    console.log(`Failed updates: ${errorCount}`);

  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

// Make functions available globally
window.migrationDryRun = migrationDryRun;
window.executeMigration = executeMigration;

console.log('='.repeat(60));
console.log('MIGRATION SCRIPT LOADED');
console.log('='.repeat(60));
console.log('');
console.log('Available commands:');
console.log('  migrationDryRun()   - Preview changes without applying them');
console.log('  executeMigration()  - Apply the changes (run dry run first!)');
console.log('');
console.log('Start by running: migrationDryRun()');
console.log('');
