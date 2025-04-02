import { insertKirjaus, updateEntry, deleteEntry } from "../models/entry-models.js";
import { customError } from "../middlewares/error-handler.js";

const createEntry = async (req, res, next) => {
  const kayttajaId = req.user.kayttaja_id;
  const kirjausData = req.body;

  try {
    const result = await insertKirjaus(kayttajaId, kirjausData);
    res.status(201).json({ message: "Kirjaus lisätty onnistuneesti", result });
  } catch (error) {
    next(customError(error.message, 400));
  }
};

const patchEntry = async (req, res, next) => {
  try {
    const result = await updateEntry(
      req.user.kayttaja_id,
      req.params.pvm,
      req.body
    );

    if (result.affectedRows === 0) {
      return next(
        customError("Kirjausta ei löytynyt tai se ei kuulunut käyttäjälle", 404)
      );
    }
    res.status(200).json({ message: "Kirjaus päivitetty onnistuneesti" });
  } catch (error) {
    console.error("Error in patchEntry:", error);
    next(customError(error.message, 400));
  }
};

const deleteEntryByDate = async (req, res, next) => {
  try {
    const result = await deleteEntry(req.user.kayttaja_id, req.params.pvm);

    if (result.error) {
      return next(customError(result.error, 404));
    }

    res.status(200).json({message: result.message});
  } catch (error) {
    next(customError(error.message, 400));
  }
};

export { createEntry, patchEntry, deleteEntryByDate };
