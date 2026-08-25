# Postman collections

Two ready-to-import Postman collections used alongside this framework:

| File | Purpose |
|------|---------|
| [`DummyJSON-Carts.postman_collection.json`](./DummyJSON-Carts.postman_collection.json) | Manual exploration of the DummyJSON `/carts` endpoints that back the bonus API + UI scenario. |
| [`Qase-TestCases.postman_collection.json`](./Qase-TestCases.postman_collection.json) | Sanity-check / manage Qase.io test cases and runs against the `SAUCEPW` project. |

## Import

1. Open Postman -> `File` -> `Import` -> `Upload files`.
2. Pick one (or both) of the `.json` files in this folder.
3. In the collection **Variables** tab, fill in what you need:
   - **DummyJSON:** already usable, no auth. Tweak `cart_id` / `user_id` per request.
   - **Qase:** paste your API token into `qase_api_token`. Do **not** commit the
     token back to git.

## Notes on Qase auth

Qase uses a simple `Token` header, applied at collection level. Requests inherit
it automatically. If you want to rotate the token, just update the collection
variable -- no need to touch each request.

## Do not commit real tokens

The `qase_api_token` variable is intentionally blank in the committed file.
If you save your token into the collection while working, remember to clear it
before committing changes to this file. `postman_collection.json` is not
gitignored -- it must remain shareable.
