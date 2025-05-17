<div class="form-container" style="
    font-family: Arial, sans-serif;
    background-color: #FFFFFF;
    padding: 20px 40px;
    border-radius: 12px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
    max-width: 400px;
    width: 100%;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 15px;
    color: #333;
">
    <h2 style="text-align: center; margin-bottom: 20px; color: #333;">Contact Me</h2>
    <form action="https://webto.salesforce.com/servlet/servlet.WebToLead?encoding=UTF-8&orgId=00D4W000007OSZr" method="POST"
          style="display: flex; flex-direction: column; gap: 10px;">
        
        <input type="hidden" name="captcha_settings" value='{"keyname":"NewCaptcha","fallback":"true","orgId":"00D4W000007OSZr","ts":""}'>
        <input type="hidden" name="oid" value="00D4W000007OSZr">
        <input type="hidden" name="retURL" value="https://calebj-dev-ed.my.site.com/portfolio/s/thanks">

        <label for="first_name" style="color: #333;">First Name</label>
        <input type="text" id="first_name" name="first_name" maxlength="40" style="padding: 10px; border: 1px solid #ccc; border-radius: 6px; color: #333;">

        <label for="last_name" style="color: #333;">Last Name</label>
        <input type="text" id="last_name" name="last_name" maxlength="80" style="padding: 10px; border: 1px solid #ccc; border-radius: 6px; color: #333;">

        <label for="email" style="color: #333;">Email</label>
        <input type="text" id="email" name="email" maxlength="80" style="padding: 10px; border: 1px solid #ccc; border-radius: 6px; color: #333;">

        <label for="company" style="color: #333;">Company</label>
        <input type="text" id="company" name="company" maxlength="40" style="padding: 10px; border: 1px solid #ccc; border-radius: 6px; color: #333;">

        <label for="state" style="color: #333;">State/Province</label>
        <input type="text" id="state" name="state" maxlength="20" style="padding: 10px; border: 1px solid #ccc; border-radius: 6px; color: #333;">

        <label for="description" style="color: #333;">Description</label>
        <textarea name="description" style="padding: 10px; border: 1px solid #ccc; border-radius: 6px; color: #333; height: 100px;"></textarea>

        <div class="g-recaptcha" data-sitekey="6LdOxzgrAAAAAKaGlH3R5QFb-IEnaWd4EKc6s0Mo" 
             style="margin-top: 15px;"></div>

        <input type="submit" value="Submit" 
               style="background-color: #0D9DDA; color: #fff; border: none; padding: 12px; border-radius: 6px; cursor: pointer; font-weight: bold; margin-top: 15px;">
    </form>
</div>


















<form action="https://webto.salesforce.com/servlet/servlet.WebToLead?encoding=UTF-8&orgId=00D4W000007OSZr" method="POST">

<input type=hidden name="oid" value="00D4W000007OSZr">
<input type=hidden name="retURL" value="https://calebj-dev-ed.my.site.com/portfolio/s/thanks">

<!--  ----------------------------------------------------------------------  -->
<!--  NOTE: These fields are optional debugging elements. Please uncomment    -->
<!--  these lines if you wish to test in debug mode.                          -->
<!--  <input type="hidden" name="debug" value=1>                              -->
<!--  <input type="hidden" name="debugEmail" value="calebnj@live.com">        -->
<!--  ----------------------------------------------------------------------  -->

<label for="first_name"></label><input placeholder="First Name" id="first_name" maxlength="40" name="first_name" size="20" type="text" /><br>

<label for="last_name"></label><input placeholder="Last Name" id="last_name" maxlength="80" name="last_name" size="20" type="text" /><br>

<label for="email"></label><input placeholder="Email" id="email" maxlength="80" name="email" size="20" type="text" /><br>

<label for="company"></label><input placeholder="Company" id="company" maxlength="40" name="company" size="20" type="text" /><br>

<label for="state"></label><input placeholder="State" id="state" maxlength="20" name="state" size="20" type="text" /><br>

<label for="description"></label><textarea placeholder="Comment or Question" name="description"></textarea><br>

<input type="submit" name="submit">

</form>