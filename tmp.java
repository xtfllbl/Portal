Transaction transaction = card.verify()
        .withAddress(address)
        .withAvs(authorizeData.getIsAvs())
        .withCardBrandStorage(StoredCredentialInitiator.CardHolder)
        .withAllowDuplicates(true)
        .execute();

Transaction transaction = card.verify()
        .withAddress(address)
        .withAvs(authorizeData.getIsAvs())
        .withCardBrandStorage(StoredCredentialInitiator.CardHolder)
        .withAllowDuplicates(true)
        .execute();
