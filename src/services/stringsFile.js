// file to hold all the messages strings

// Path: src/services/stringsFile.js

const strings = {
    welcomeMessage: `<b>ברוכים הבאים לPassionVideo</b>, המקום שבו אנו מספקות את השירות האיכותי ביותר לשיחות וידאו ושירותים למבוגרים (ללא מפגשים) 🌟
    אנחנו משקיעות את מיטב המאמצים במרחב האינטימי הזה, כדי להבטיח שתוכל להנות מאינספור חוויות יחודיות עם מקסימום בטיחות ודיסקרטיות 🔒
    
    הצוות שלנו כאן תמיד כדי לסייע לך עם כל שאלה או דאגה 😊 וכאן לשירותך בכל שעה 🤝`,
    catalogMessage: "הנה הקטלוג שלנו:",
    catalogButton: "קטלוג",
    joinButton: "איך להצטרף",
    infoButton: "מידע נוסף",
    helpButton: "תמיכה",
    contactButton: "צור קשר",
    viewButton: "הצג",
    // short model message with starting chat 
    shortModelMessage: (model) => {
        return `<b>בחרת ב${model.name}</b>\n` +
            `<b>גיל:</b> ${model.age}\n` +
            `🚺 מגדר: נקבה ♀️\n` +
            `<b>קצת עלי:</b> ${model.aboutMe} 🔥💋\n\n\n` +
            `💌 אנא המתן לשיחת אימות עם הדוגמנית 👇`;
    },
    modelMessage: (model) => {
        // Format main service information
        const mainServiceInfo = `🎥 ${model.mainService.description}\n⏰ משך שיחה: ${model.mainService.duration}\n💰 מחיר: ${model.mainService.price}`;

        // Format additional services information
        let additionalServicesInfo = '';
        model.moreServices.forEach(service => {
            if (service.items) return;
            additionalServicesInfo += `🎥 ${service.description}\n⏰ משך שיחה: ${service.duration}\n💰 מחיר: ${service.price}\n\n\n`;
        });

        // Add itemized list of items for sale
        let itemsForSale = '';

        if (model.moreServices.some(service => service.items)) {
            model.moreServices.forEach(service => {
                if (service.items) {
                    service.items.forEach(item => {
                        itemsForSale += `👙 ${item.type}\n💰 מחיר: ${item.price} ${item.shippingIncluded ? '🚚 כולל משלוח' : ''}\n\n`;
                    });
                }
            });
        }

        // Construct the full message
        return `<b>${model.name}</b>\n` +
            `<b>גיל:</b> ${model.age}\n` +
            `🚺 מגדר: נקבה ♀️\n` +
            `<b>קצת עלי:</b> ${model.aboutMe} 🔥💋\n\n\n` +
            `<b>שירות ראשי:</b>\n${mainServiceInfo}\n\n\n` +
            `<b>שירותים נוספים:</b>\n${additionalServicesInfo}`;
            //`<b>פריטים למכירה:</b>\n${itemsForSale}` +

            //`💌 לתיאום מפגש וירטואלי: יש לשלוח הודעה לטלגרם @Mj45667 או ללחוץ על כפתור "התחל שיחה" 👇`;
    },



    helpMessage: `לקבלת עזרה, יש יש לפנות ל @Mj45667`,
    contactMessage: `💌 יצירת קשר
    תמיד שמחות לשמוע ממך ❤️\n\n
לתיאום שיחה או לכל שאלה, שלח לנו הודעה למנהלת בשם המשתמש @Mj45667 👈
\n\nניתן ללחוץ על שם המשתמש למעלה 👆 או להשתמש בכפתור יצירת קשר בתפריט הראשי\n\n
    אם שינית את דעתך, זה בסדר גמור 😢
    `,
    infoMessage: "מידע נוסף",
    verifyMessage: "בצע אימות כדי להמשיך",
    verifiedMessage: "המשתמש מאומת",
    verificationMessage: () => "Please verify your account by entering the code shown in the image below:",
    verificationFailedMessage: () => "The verification code entered was incorrect, please try again:",
    verifiedMessage: () => "You are now verified!",
    verifyButton: "אמת",


};





module.exports = strings;

