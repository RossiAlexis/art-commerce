# Art by Vero Miller

An art portfolio that presents Vero Miller's paintings to visitors and provides a private area for maintaining the portfolio.

## Language

**Painting**:
The core portfolio work, described by a title, price in Canadian dollars, measurements, and descriptive text. A Painting belongs to at most one **Category**; without an image it remains administrable but is not publicly visible.
_Avoid_: Artwork, piece

**Category**:
A grouping with a management name and a distinct public navigation label, used to filter and navigate **Paintings**. A Category may contain many Paintings.
_Avoid_: Collection, tag

**Homepage**:
The portfolio's single public introduction, consisting of introductory text and an optional image.
_Avoid_: Landing page

**Painting inquiry**:
A **Contact message** expressing interest in buying a specific **Painting**. It identifies the Painting but is not an order or a completed sale.
_Avoid_: Purchase, order

**Contact message**:
A message sent by a visitor to the Artist. Delivery to the Artist determines whether the submission succeeded; a visitor auto-reply is supplementary.
_Avoid_: Ticket, submission

**Administration area**:
The private part of the portfolio where an authorized **Administrator** maintains Paintings, Categories, and the Homepage.
_Avoid_: Dashboard, back office

**Administrator**:
A person authenticated by username and password and explicitly granted administrative access to maintain portfolio content through the **Administration area**.
_Avoid_: User, owner

## Example dialogue

> **Administrator:** Move this Painting into the “Abstract” Category and make its second image appear first.
>
> **Developer:** Should the Painting remain visible when visitors view all Paintings without a Category filter?
>
> **Administrator:** Yes. A Category organizes a Painting; it does not control whether the Painting is public. A visitor can open it and send a Painting inquiry.
